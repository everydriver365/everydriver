import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GeotabSession {
  sessionId: string;
  serverUrl: string;
  expiresAt: number;
}

let cachedSession: GeotabSession | null = null;

// Device list cache (serial -> internal ID mapping)
let cachedDeviceList: { data: Map<string, string>; reverse: Map<string, string>; expiresAt: number } | null = null;
const DEVICE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Media sync throttle
let lastMediaSyncAt = 0;
const MEDIA_SYNC_INTERVAL = 60_000; // 60 seconds

async function authenticate(supabaseClient?: any): Promise<GeotabSession> {
  // 1. Check in-memory cache first
  if (cachedSession && cachedSession.expiresAt > Date.now()) {
    return cachedSession;
  }

  // 2. Check database cache (survives cold starts)
  if (supabaseClient) {
    try {
      const { data: dbSession } = await supabaseClient
        .from("geotab_session_cache")
        .select("session_id, server_url, expires_at")
        .eq("id", "default")
        .maybeSingle();

      if (dbSession && new Date(dbSession.expires_at).getTime() > Date.now()) {
        console.log("[GeotabPoller] Reusing DB-cached session, server:", dbSession.server_url);
        cachedSession = {
          sessionId: dbSession.session_id,
          serverUrl: dbSession.server_url,
          expiresAt: new Date(dbSession.expires_at).getTime(),
        };
        return cachedSession;
      }
    } catch (e) {
      console.log("[GeotabPoller] DB session cache lookup failed (non-critical):", e);
    }
  }

  // 3. Authenticate with Geotab API
  const database = Deno.env.get("GEOTAB_DATABASE");
  const username = Deno.env.get("GEOTAB_USERNAME");
  const password = Deno.env.get("GEOTAB_PASSWORD");

  if (!database || !username || !password) {
    throw new Error("Geotab credentials not configured");
  }

  const res = await fetch("https://my.geotab.com/apiv1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "Authenticate",
      params: { database, userName: username, password },
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(`Geotab auth failed: ${data.error.message}`);

  const { credentials, path } = data.result;
  const resolvedPath = (!path || path.toLowerCase() === "thisserver")
    ? "my.geotab.com"
    : path;

  console.log("[GeotabPoller] Fresh auth, server:", resolvedPath);

  const expiresAt = Date.now() + 20 * 60 * 1000;
  cachedSession = {
    sessionId: credentials.sessionId,
    serverUrl: `https://${resolvedPath}/apiv1`,
    expiresAt,
  };

  // 4. Persist to DB so other isolates can reuse
  if (supabaseClient) {
    try {
      await supabaseClient.from("geotab_session_cache").upsert({
        id: "default",
        session_id: credentials.sessionId,
        server_url: cachedSession.serverUrl,
        expires_at: new Date(expiresAt).toISOString(),
      });
    } catch (e) {
      console.log("[GeotabPoller] Failed to persist session to DB (non-critical):", e);
    }
  }

  return cachedSession;
}

// Single Geotab API call (used only for non-batched calls like auth, GetFeed)
async function geotabCall(session: GeotabSession, method: string, params: Record<string, unknown>) {
  const res = await fetch(session.serverUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method,
      params: {
        ...params,
        credentials: {
          sessionId: session.sessionId,
          database: Deno.env.get("GEOTAB_DATABASE"),
          userName: Deno.env.get("GEOTAB_USERNAME"),
        },
      },
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(`Geotab ${method} failed: ${data.error.message}`);
  return data.result;
}

// ExecuteMultiMethod — batch multiple Geotab calls into ONE HTTP request
async function geotabMultiCall(
  session: GeotabSession,
  calls: Array<{ method: string; params: Record<string, unknown> }>
): Promise<any[]> {
  const credentials = {
    sessionId: session.sessionId,
    database: Deno.env.get("GEOTAB_DATABASE"),
    userName: Deno.env.get("GEOTAB_USERNAME"),
  };

  const res = await fetch(session.serverUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "ExecuteMultiCall",
      params: {
        calls: calls.map((c) => ({
          method: c.method,
          params: { ...c.params },
        })),
        credentials,
      },
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(`Geotab ExecuteMultiCall failed: ${data.error.message}`);
  return data.result; // Array of results, one per call
}

// Get or refresh the cached device list (serial -> internal ID)
async function getDeviceMaps(session: GeotabSession): Promise<{
  serialToInternal: Map<string, string>;
  internalToSerial: Map<string, string>;
}> {
  if (cachedDeviceList && cachedDeviceList.expiresAt > Date.now()) {
    return { serialToInternal: cachedDeviceList.data, internalToSerial: cachedDeviceList.reverse };
  }

  // This uses 1 API call, but only every 5 minutes
  const geotabDevices = await geotabCall(session, "Get", { typeName: "Device" });

  const serialToInternal = new Map<string, string>();
  const internalToSerial = new Map<string, string>();
  for (const gd of geotabDevices || []) {
    if (gd.serialNumber) {
      serialToInternal.set(gd.serialNumber, gd.id);
      internalToSerial.set(gd.id, gd.serialNumber);
    }
  }

  cachedDeviceList = {
    data: serialToInternal,
    reverse: internalToSerial,
    expiresAt: Date.now() + DEVICE_CACHE_TTL,
  };

  console.log("[GeotabPoller] Refreshed device cache:", serialToInternal.size, "devices");
  return { serialToInternal, internalToSerial };
}

// Reverse geocode to get road name using Nominatim
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "User-Agent": "EveryDriverApp/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.address?.road || data.address?.pedestrian || data.address?.footway || data.display_name?.split(",")[0] || null;
  } catch {
    return null;
  }
}

// Throttle for slow diagnostics path
let lastDiagnosticsAt = 0;
const DIAGNOSTICS_INTERVAL = 60_000; // 60 seconds

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Determine polling mode: "fast" = position-only, "full" = everything
    let pollMode = "full";
    try {
      const body = await req.clone().json();
      if (body?.mode === "fast") pollMode = "fast";
    } catch { /* no body or not JSON — default to full */ }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all active Geotab devices from our DB
    const { data: devices, error: devErr } = await supabase
      .from("gps_devices")
      .select("id, instructor_id, geotab_device_id, device_name")
      .eq("tracking_provider", "geotab")
      .not("geotab_device_id", "is", null);

    if (devErr) throw devErr;
    if (!devices || devices.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "No Geotab devices" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = await authenticate(supabase);
    const deviceMap = new Map(devices.map((d) => [d.geotab_device_id, d]));

    // Get cached device ID mappings (only hits Geotab API every 5 min)
    const { serialToInternal, internalToSerial } = await getDeviceMaps(session);

    // Resolve our serial-based IDs to Geotab internal IDs
    const resolvedGeotabIds: string[] = [];
    for (const d of devices) {
      const internalId = serialToInternal.get(d.geotab_device_id);
      resolvedGeotabIds.push(internalId || d.geotab_device_id);
    }

    // Should we include diagnostics/faults in this cycle?
    const shouldIncludeDiagnostics = pollMode === "full" || (Date.now() - lastDiagnosticsAt > DIAGNOSTICS_INTERVAL);

    // ---- BATCHED CALL ----
    const now = new Date();
    const twoMinAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Diagnostic IDs we want from Geotab StatusData
    const diagnosticIds = [
      "DiagnosticIgnitionId",                  // Ignition on/off (1 or 0)
      "DiagnosticFuelLevelId",
      "DiagnosticStateOfChargeId",            // State of Charge (%)
      "DiagnosticBatteryVoltageId",            // 12V battery voltage (V)
      "DiagnosticEngineCoolantTemperatureId",
      "DiagnosticEngineHoursAdjustmentId",
      "DiagnosticOdometerAdjustmentId",
      "DiagnosticTirePressureFrontLeftId",
      "DiagnosticTirePressureFrontRightId",
      "DiagnosticTirePressureRearLeftId",
      "DiagnosticTirePressureRearRightId",
      "DiagnosticBrakePedalPositionId",        // Brake pedal % for pupil analysis
      "DiagnosticTransmissionCurrentGearId",   // Current gear for reverse detection
    ];

    const batchCalls: Array<{ method: string; params: Record<string, unknown> }> = [
      // Call 0: DeviceStatusInfo for all devices
      {
        method: "Get",
        params: {
          typeName: "DeviceStatusInfo",
          search: {
            deviceSearch: resolvedGeotabIds.length === 1
              ? { id: resolvedGeotabIds[0] }
              : {},
          },
        },
      },
    ];

    // Add PostedRoadSpeed calls for each device (calls 1..N)
    for (const gid of resolvedGeotabIds) {
      batchCalls.push({
        method: "GetPostedRoadSpeedsForDevice",
        params: {
          deviceSearch: { id: gid },
          fromDate: twoMinAgo.toISOString(),
          toDate: now.toISOString(),
          postedRoadSpeedOptions: "None",
        },
      });
    }

    const speedLimitCallCount = resolvedGeotabIds.length;

    // Add StatusData calls — only in diagnostic cycles (every ~60s or full mode)
    if (shouldIncludeDiagnostics) {
      for (const gid of resolvedGeotabIds) {
        for (const diagId of diagnosticIds) {
          batchCalls.push({
            method: "Get",
            params: {
              typeName: "StatusData",
              search: {
                deviceSearch: { id: gid },
                diagnosticSearch: { id: diagId },
                fromDate: thirtyMinAgo.toISOString(),
                toDate: now.toISOString(),
              },
              resultsLimit: 5,
            },
          });
        }
      }

      // Add FaultData call for all devices
      batchCalls.push({
        method: "Get",
        params: {
          typeName: "FaultData",
          search: {
            fromDate: twentyFourHoursAgo.toISOString(),
            toDate: now.toISOString(),
          },
          resultsLimit: 200,
        },
      });

      // Add ExceptionEvent call for impact/harsh event detection (last 2 minutes)
      batchCalls.push({
        method: "Get",
        params: {
          typeName: "ExceptionEvent",
          search: {
            fromDate: twoMinAgo.toISOString(),
            toDate: now.toISOString(),
          },
          resultsLimit: 50,
        },
      });
    }

    console.log("[GeotabPoller] Sending batched call with", batchCalls.length, "methods");
    const batchResults = await geotabMultiCall(session, batchCalls);

    // Parse results
    const statusResults: any[] = batchResults[0] || [];

    // Speed limit results: one per device, starting at index 1
    const speedLimitMap = new Map<string, number>();
    for (let i = 0; i < speedLimitCallCount; i++) {
      const slResults = batchResults[1 + i];
      if (slResults && slResults.length > 0) {
        const latest = slResults[slResults.length - 1];
        if (latest.maxSpeed != null && latest.maxSpeed > 0) {
          speedLimitMap.set(resolvedGeotabIds[i], latest.maxSpeed);
        }
      }
    }

    // StatusData results: diagnosticIds.length calls per device, starting after speed limit calls
    const statusDataOffset = 1 + speedLimitCallCount;
    const deviceDiagnostics = new Map<string, Record<string, number>>();
    for (let i = 0; i < resolvedGeotabIds.length; i++) {
      const diags: Record<string, number> = {};
      for (let j = 0; j < diagnosticIds.length; j++) {
        const callIdx = statusDataOffset + i * diagnosticIds.length + j;
        const sdResults: any[] = batchResults[callIdx] || [];
        if (sdResults.length > 0) {
          // Use the last (most recent) value
          const latest = sdResults[sdResults.length - 1];
          if (latest.data != null) {
            diags[diagnosticIds[j]] = latest.data;
          }
        }
      }
      if (Object.keys(diags).length > 0) {
        console.log("[GeotabPoller] Diagnostics for device", resolvedGeotabIds[i], ":", JSON.stringify(diags));
        deviceDiagnostics.set(resolvedGeotabIds[i], diags);
      }
    }

    const deviceFaults = new Map<string, any[]>();

    // Common OBD-II DTC descriptions
    const DTC_DESCRIPTIONS: Record<string, string> = {
      "P0100": "Mass air flow sensor circuit malfunction",
      "P0101": "Mass air flow sensor range/performance",
      "P0102": "Mass air flow sensor circuit low input",
      "P0103": "Mass air flow sensor circuit high input",
      "P0106": "MAP/barometric pressure sensor range/performance",
      "P0107": "MAP/barometric pressure sensor circuit low",
      "P0108": "MAP/barometric pressure sensor circuit high",
      "P0110": "Intake air temperature sensor circuit malfunction",
      "P0115": "Engine coolant temperature sensor circuit malfunction",
      "P0120": "Throttle position sensor circuit malfunction",
      "P0121": "Throttle position sensor range/performance",
      "P0125": "Insufficient coolant temperature for closed-loop fuel",
      "P0128": "Coolant thermostat below regulating temperature",
      "P0130": "O2 sensor circuit malfunction (Bank 1, Sensor 1)",
      "P0131": "O2 sensor circuit low voltage (Bank 1, Sensor 1)",
      "P0133": "O2 sensor slow response (Bank 1, Sensor 1)",
      "P0135": "O2 sensor heater circuit malfunction (Bank 1, Sensor 1)",
      "P0141": "O2 sensor heater circuit malfunction (Bank 1, Sensor 2)",
      "P0171": "System too lean (Bank 1)",
      "P0172": "System too rich (Bank 1)",
      "P0174": "System too lean (Bank 2)",
      "P0175": "System too rich (Bank 2)",
      "P0191": "Fuel rail pressure sensor range/performance",
      "P0200": "Injector circuit malfunction",
      "P0217": "Engine over-temperature condition",
      "P0230": "Fuel pump primary circuit malfunction",
      "P0300": "Random/multiple cylinder misfire detected",
      "P0301": "Cylinder 1 misfire detected",
      "P0302": "Cylinder 2 misfire detected",
      "P0303": "Cylinder 3 misfire detected",
      "P0304": "Cylinder 4 misfire detected",
      "P0325": "Knock sensor circuit malfunction (Bank 1)",
      "P0335": "Crankshaft position sensor circuit malfunction",
      "P0340": "Camshaft position sensor circuit malfunction",
      "P0400": "Exhaust gas recirculation flow malfunction",
      "P0401": "EGR flow insufficient detected",
      "P0420": "Catalyst system efficiency below threshold (Bank 1)",
      "P0430": "Catalyst system efficiency below threshold (Bank 2)",
      "P0440": "Evaporative emission system malfunction",
      "P0441": "Evaporative emission system incorrect purge flow",
      "P0442": "Evaporative emission system leak (small)",
      "P0443": "Evaporative emission system purge valve circuit",
      "P0446": "Evaporative emission system vent control malfunction",
      "P0455": "Evaporative emission system leak (large)",
      "P0456": "Evaporative emission system leak (very small)",
      "P0500": "Vehicle speed sensor malfunction",
      "P0505": "Idle air control system malfunction",
      "P0507": "Idle air control system RPM higher than expected",
      "P0562": "System voltage low",
      "P0563": "System voltage high",
      "P0600": "Serial communication link malfunction",
      "P0700": "Transmission control system malfunction",
      "P0705": "Transmission range sensor circuit malfunction",
      "P0715": "Input/turbine speed sensor circuit malfunction",
      "P0720": "Output speed sensor circuit malfunction",
      "P0741": "Torque converter clutch solenoid performance",
      "P0750": "Shift solenoid A malfunction",
      "P1000": "OBD-II monitor testing not complete",
      "P2096": "Post catalyst fuel trim too lean (Bank 1)",
      "P2097": "Post catalyst fuel trim too rich (Bank 1)",
      "P2135": "Throttle position sensor voltage correlation",
      "P2187": "System too lean at idle (Bank 1)",
      "P2188": "System too rich at idle (Bank 1)",
      "B0001": "Driver frontal stage 1 deployment control",
      "B0002": "Driver frontal stage 2 deployment control",
      "B0100": "Passenger frontal stage 1 deployment control",
      "C0035": "Left front wheel speed sensor circuit",
      "C0040": "Right front wheel speed sensor circuit",
      "C0045": "Left rear wheel speed sensor circuit",
      "C0050": "Right rear wheel speed sensor circuit",
      "C0300": "Rear speed sensor malfunction",
      "U0001": "High speed CAN communication bus",
      "U0100": "Lost communication with ECM/PCM",
      "U0101": "Lost communication with TCM",
      "U0121": "Lost communication with ABS",
      "U0140": "Lost communication with body control module",
      "U0155": "Lost communication with instrument cluster",
    };

    function formatDTC(rawCode: string, controllerName: string): string {
      const cn = (controllerName || "").toLowerCase();
      const prefix = cn.includes("body") ? "B"
        : cn.includes("chassis") ? "C"
        : cn.includes("network") || cn.includes("communication") ? "U"
        : "P";
      const hex = parseInt(rawCode, 16);
      if (isNaN(hex)) return rawCode.toUpperCase();
      return prefix + hex.toString(16).toUpperCase().padStart(4, "0");
    }

    // FaultData results: second-to-last call (ExceptionEvent is last)
    const faultResults: any[] = batchResults[batchResults.length - 2] || [];
    const exceptionResults: any[] = batchResults[batchResults.length - 1] || [];
    for (const fault of faultResults) {
      const faultDeviceId = fault.device?.id;
      if (!faultDeviceId) continue;
      if (!deviceFaults.has(faultDeviceId)) deviceFaults.set(faultDeviceId, []);
      const dtcCode = formatDTC(fault.code || fault.id, fault.controller?.name);
      deviceFaults.get(faultDeviceId)!.push({
        code: dtcCode,
        description: DTC_DESCRIPTIONS[dtcCode]
          || fault.name
          || fault.diagnostic?.name
          || "Unrecognised fault – consult mechanic",
        severity: fault.failureModeId?.name || fault.severity || "Unknown",
        source: fault.controller?.name || fault.source || "ECU",
      });
    }

    console.log("[GeotabPoller] Got", statusResults.length, "status results,", speedLimitMap.size, "speed limits,", deviceDiagnostics.size, "diagnostic sets,", deviceFaults.size, "devices with faults");

    // Process each device status
    for (const status of statusResults) {
      let device = deviceMap.get(status.device?.id);
      if (!device) {
        const serial = internalToSerial.get(status.device?.id);
        if (serial) device = deviceMap.get(serial);
      }
      if (!device) continue;

      const geotabInternalId = serialToInternal.get(device.geotab_device_id) || device.geotab_device_id;

      // Road name from Nominatim (free, no rate limit concern)
      let roadName: string | null = null;
      if (status.latitude && status.longitude) {
        roadName = await reverseGeocode(status.latitude, status.longitude);
      }

      // Speed limit from batched result
      const speedLimitKmh = speedLimitMap.get(geotabInternalId) ?? null;

      // Use device-reported time, not server time
      const geotabSeenAt = status.dateTime || null;

      // Get diagnostics for this device
      const diags = deviceDiagnostics.get(geotabInternalId) || {};
      const faults = deviceFaults.get(geotabInternalId) || null;

      // Build diagnostics update
      const diagnosticsUpdate: Record<string, unknown> = {};
      // Ignition: DiagnosticIgnitionId returns 1 for ON, 0 for OFF
      if (diags["DiagnosticIgnitionId"] != null) {
        diagnosticsUpdate.last_ignition_status = diags["DiagnosticIgnitionId"] === 1;
      }
      if (diags["DiagnosticFuelLevelId"] != null) {
        // Geotab returns fuel level as a fraction 0-1, multiply by 100 for percentage
        const rawFuel = diags["DiagnosticFuelLevelId"];
        diagnosticsUpdate.last_fuel_percent = Math.round((rawFuel <= 1 ? rawFuel * 100 : rawFuel) * 100) / 100;
      }
      if (diags["DiagnosticStateOfChargeId"] != null) {
        // State of Charge is a percentage (0-100) — do NOT use this for voltage
        diagnosticsUpdate.last_battery_percent = Math.round(diags["DiagnosticStateOfChargeId"]);
      }
      // Use true 12V battery voltage if available
      if (diags["DiagnosticBatteryVoltageId"] != null) {
        diagnosticsUpdate.last_battery_voltage = Math.round(diags["DiagnosticBatteryVoltageId"] * 100) / 100;
      }
      if (diags["DiagnosticEngineCoolantTemperatureId"] != null) {
        diagnosticsUpdate.last_coolant_temp_c = Math.round(diags["DiagnosticEngineCoolantTemperatureId"] * 10) / 10;
      }
      if (diags["DiagnosticEngineHoursAdjustmentId"] != null) {
        // Geotab returns engine hours in seconds
        diagnosticsUpdate.last_engine_hours = Math.round((diags["DiagnosticEngineHoursAdjustmentId"] / 3600) * 10) / 10;
      }
      if (diags["DiagnosticOdometerAdjustmentId"] != null) {
        // Geotab returns odometer in meters
        diagnosticsUpdate.last_ecu_odometer_km = Math.round((diags["DiagnosticOdometerAdjustmentId"] / 1000) * 10) / 10;
      }

      // Tire pressure (collect all available)
      // Geotab returns tire pressure in Pascals — convert to kPa for storage
      const tirePressure: Record<string, number> = {};
      if (diags["DiagnosticTirePressureFrontLeftId"] != null) tirePressure.frontLeft = Math.round(diags["DiagnosticTirePressureFrontLeftId"] / 1000);
      if (diags["DiagnosticTirePressureFrontRightId"] != null) tirePressure.frontRight = Math.round(diags["DiagnosticTirePressureFrontRightId"] / 1000);
      if (diags["DiagnosticTirePressureRearLeftId"] != null) tirePressure.rearLeft = Math.round(diags["DiagnosticTirePressureRearLeftId"] / 1000);
      if (diags["DiagnosticTirePressureRearRightId"] != null) tirePressure.rearRight = Math.round(diags["DiagnosticTirePressureRearRightId"] / 1000);
      if (Object.keys(tirePressure).length > 0) {
        diagnosticsUpdate.last_tire_pressure_json = tirePressure;
      }

      if (faults && faults.length > 0) {
        diagnosticsUpdate.last_fault_codes = faults;
      }

      if (Object.keys(diagnosticsUpdate).length > 0) {
        diagnosticsUpdate.last_diagnostics_at = new Date().toISOString();
      }

      await supabase
        .from("gps_devices")
        .update({
          last_latitude: status.latitude,
          last_longitude: status.longitude,
          last_speed_kmh: status.speed,
          last_heading: status.bearing ?? null,
          
          last_seen_at: geotabSeenAt
            ? new Date(geotabSeenAt).toISOString()
            : null,
          last_heartbeat_at: new Date().toISOString(),
          last_road_name: roadName,
          last_speed_limit_kmh: speedLimitKmh,
          ...diagnosticsUpdate,
        })
        .eq("id", device.id);

      // Write battery history if we have a percent value
      const batteryPct = diagnosticsUpdate.last_battery_percent as number | undefined;
      if (batteryPct != null) {
        const { error: battHistErr } = await supabase.from("gps_battery_history").insert({
          device_id: device.id,
          instructor_id: device.instructor_id,
          battery_percent: batteryPct,
        });
        if (battHistErr) console.error("[GeotabPoller] Battery history insert error:", battHistErr.message);
      }

      // If device has an active session, record GPS point for route history
      const { data: deviceRow } = await supabase
        .from("gps_devices")
        .select("current_session_id, session_start_ecu_odometer_km, daily_start_ecu_odometer_km, daily_start_date")
        .eq("id", device.id)
        .single();

      // --- ECU odometer-based daily tracking ---
      const currentEcuKm = diagnosticsUpdate.last_ecu_odometer_km as number | undefined
        ?? (diags["DiagnosticOdometerAdjustmentId"] != null ? Math.round((diags["DiagnosticOdometerAdjustmentId"] / 1000) * 10) / 10 : undefined);
      const todayStr = new Date().toISOString().split("T")[0];

      if (currentEcuKm != null) {
        // Reset daily start if new day or not set
        if (!deviceRow?.daily_start_date || deviceRow.daily_start_date !== todayStr) {
          await supabase
            .from("gps_devices")
            .update({
              daily_start_ecu_odometer_km: currentEcuKm,
              daily_start_date: todayStr,
            })
            .eq("id", device.id);
        }

        // Sync ECU odometer → linked vehicle's current_odometer_km
        if (device.vehicle_id) {
          await supabase
            .from("instructor_vehicles")
            .update({ current_odometer_km: currentEcuKm })
            .eq("id", device.vehicle_id);
        }
      }

      // Sync engine hours → linked vehicle for maintenance tracking
      const currentEngineHours = diagnosticsUpdate.last_engine_hours as number | undefined;
      if (currentEngineHours != null && device.vehicle_id) {
        // Update next_service_due_km isn't needed here — the service reminders
        // system reads current_odometer_km and engine hours from the device directly
      }

      if (deviceRow?.current_session_id && status.latitude && status.longitude) {
        await supabase
          .from("telematics_gps_points")
          .insert({
            telematics_id: deviceRow.current_session_id,
            latitude: status.latitude,
            longitude: status.longitude,
            speed_kmh: status.speed ?? null,
            heading: status.bearing ?? null,
            road_name: roadName,
            speed_limit_kmh: speedLimitKmh,
            recorded_at: new Date().toISOString(),
          });

        // Record brake pedal and gear data for pupil driving pattern analysis
        const brakePedalPct = diags["DiagnosticBrakePedalPositionId"];
        const gearPosition = diags["DiagnosticTransmissionCurrentGearId"];
        if (brakePedalPct != null || gearPosition != null) {
          await supabase
            .from("lesson_pedal_data")
            .insert({
              telematics_id: deviceRow.current_session_id,
              recorded_at: new Date().toISOString(),
              brake_pedal_pct: brakePedalPct != null ? Math.round(brakePedalPct * 100) / 100 : null,
              gear_position: gearPosition != null ? Math.round(gearPosition) : null,
            });
        }

        // Use ECU odometer delta for accurate session distance (falls back to speed-based estimate)
        if (currentEcuKm != null && deviceRow.session_start_ecu_odometer_km != null) {
          const sessionDistKm = currentEcuKm - deviceRow.session_start_ecu_odometer_km;
          if (sessionDistKm >= 0) {
            // Set total distance directly from ECU (not incremental)
            await supabase
              .from("lesson_telematics")
              .update({ total_distance_km: sessionDistKm })
              .eq("id", deviceRow.current_session_id);
          }
        } else if (status.speed > 0) {
          // Fallback: speed-based estimate when ECU data unavailable
          const distKm = (status.speed * 10) / 3600;
          if (distKm > 0.001) {
            await supabase.rpc("increment_total_distance", {
              p_id: deviceRow.current_session_id,
              p_distance: distKm,
            });
          }
        }

        // Set session start ECU odometer if not yet set
        if (currentEcuKm != null && deviceRow.session_start_ecu_odometer_km == null) {
          await supabase
            .from("gps_devices")
            .update({ session_start_ecu_odometer_km: currentEcuKm })
            .eq("id", device.id);
        }
      }

      // Update live_pupil_positions if there's an active session
      await supabase
        .from("live_pupil_positions")
        .update({
          latitude: status.latitude,
          longitude: status.longitude,
          speed_kmh: status.speed,
          heading: status.bearing,
          updated_at: new Date().toISOString(),
        })
        .eq("device_id", device.id)
        .eq("is_active", true);
    }

    // ---- MEDIA SYNC (throttled to ~once per minute via DB timestamp) ----
    let mediaInserted = 0;
    const { data: mediaConfig } = await supabase
      .from("cron_sync_config")
      .select("last_run_at")
      .eq("id", "geotab_media_feed")
      .maybeSingle();
    const lastMediaRun = mediaConfig?.last_run_at ? new Date(mediaConfig.last_run_at).getTime() : 0;
    const shouldSyncMedia = Date.now() - lastMediaRun > MEDIA_SYNC_INTERVAL;

    // ---- IMPACT DETECTION (runs every poll cycle) ----
    // ---- IMPACT DETECTION from ExceptionEvents ----
    let impactsInserted = 0;
    let pushSent = 0;

    if (exceptionResults.length > 0) {
      console.log("[GeotabPoller] Processing", exceptionResults.length, "exception events for impacts");

      // Accelerometer-related rule name patterns
      const impactRulePatterns = [
        "accelerometer", "harsh", "impact", "collision", "accident",
        "hard brake", "hard accel", "hard corner", "aggressive",
      ];

      for (const evt of exceptionResults) {
        const ruleName = (evt.rule?.name || "").toLowerCase();
        const isImpactRule = impactRulePatterns.some((p) => ruleName.includes(p));
        if (!isImpactRule) continue;

        // Find which device this belongs to
        const evtDeviceId = evt.device?.id;
        if (!evtDeviceId) continue;

        let matchedDevice = deviceMap.get(evtDeviceId);
        if (!matchedDevice) {
          const serial = internalToSerial.get(evtDeviceId);
          if (serial) matchedDevice = deviceMap.get(serial);
        }
        if (!matchedDevice) continue;

        // Estimate G-force from rule name or use a default based on severity keywords
        let gForce = 0;
        const nameUpper = ruleName;
        if (nameUpper.includes("collision") || nameUpper.includes("accident") || nameUpper.includes("impact")) {
          gForce = 3.0;
        } else if (nameUpper.includes("harsh") || nameUpper.includes("hard") || nameUpper.includes("aggressive")) {
          gForce = 1.8;
        } else if (nameUpper.includes("accelerometer")) {
          gForce = 2.0;
        }

        // Get position from the device's current status
        const deviceStatus = statusResults.find((s: any) => {
          if (s.device?.id === evtDeviceId) return true;
          const serial = internalToSerial.get(s.device?.id);
          return serial && deviceMap.get(serial)?.id === matchedDevice!.id;
        });

        const lat = deviceStatus?.latitude || null;
        const lng = deviceStatus?.longitude || null;
        const speedKmh = deviceStatus?.speed || null;

        const severity = gForce >= 3.0 ? "critical"
          : gForce >= 2.0 ? "high"
          : gForce >= 1.5 ? "medium"
          : "low";

        // Only insert if >= 1.5g
        if (gForce < 1.5) continue;

        const geotabEventId = evt.id || `${evtDeviceId}_${evt.activeFrom || new Date().toISOString()}`;

        const { error: impactErr, data: impactData } = await supabase
          .from("geotab_impact_events")
          .upsert(
            {
              instructor_id: matchedDevice.instructor_id,
              device_id: matchedDevice.id,
              g_force: gForce,
              latitude: lat,
              longitude: lng,
              speed_kmh: speedKmh,
              event_time: evt.activeFrom || new Date().toISOString(),
              severity,
              acknowledged: false,
              geotab_event_id: geotabEventId,
            },
            { onConflict: "geotab_event_id", ignoreDuplicates: true }
          )
          .select("id")
          .maybeSingle();

        if (!impactErr && impactData) {
          impactsInserted++;

          // Send push notification for critical impacts (>= 2.0g)
          if (gForce >= 2.0) {
            const speedMph = speedKmh ? Math.round(speedKmh * 0.621371) : null;
            let roadName = "unknown location";
            if (lat && lng) {
              const rn = await reverseGeocode(lat, lng);
              if (rn) roadName = rn;
            }

            const body = speedMph
              ? `${gForce.toFixed(1)}g impact detected at ${speedMph} mph near ${roadName}`
              : `${gForce.toFixed(1)}g impact detected near ${roadName}`;

            try {
              await supabase.functions.invoke("send-push-notification", {
                body: {
                  instructorId: matchedDevice.instructor_id,
                  notification: {
                    title: "⚠️ Impact Alert",
                    body,
                    tag: "impact_alert",
                    requireInteraction: true,
                    data: {
                      url: "/instructor/geotab",
                      type: "impact_alert",
                      eventId: impactData.id,
                    },
                  },
                },
              });
              pushSent++;
              console.log("[GeotabPoller] Push notification sent for", gForce.toFixed(1), "g impact");
            } catch (pushErr) {
              console.error("[GeotabPoller] Push notification failed:", pushErr);
            }
          }
        }
      }
    }

    console.log("[GeotabPoller] Impact detection:", exceptionResults.length, "events checked,", impactsInserted, "impacts inserted,", pushSent, "push notifications sent");

    if (shouldSyncMedia) {
      // Fetch driver map only during media sync (not every poll)
      const driverMap = new Map<string, string>();
      try {
        const drivers = await geotabCall(session, "Get", { typeName: "Driver" });
        for (const d of drivers || []) {
          if (d.id && d.name) driverMap.set(d.id, d.name);
        }
      } catch (e) {
        console.log("Driver fetch failed (non-critical):", e);
      }

      const { data: syncConfig } = await supabase
        .from("cron_sync_config")
        .select("*")
        .eq("id", "geotab_media_feed")
        .maybeSingle();

      const fromVersion = (syncConfig as any)?.last_error || null;

      const mediaParams: Record<string, unknown> = {
        typeName: "MediaFile",
        resultsLimit: 100,
      };
      if (fromVersion) mediaParams.fromVersion = fromVersion;

      let mediaResults: any[] = [];
      let newVersion: string | null = null;

      try {
        const feedResult = await geotabCall(session, "GetFeed", mediaParams);
        mediaResults = feedResult?.data || [];
        newVersion = feedResult?.toVersion || null;
      } catch (e) {
        console.log("MediaFile GetFeed not available, trying Get:", e);
        try {
          const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          mediaResults = await geotabCall(session, "Get", {
            typeName: "MediaFile",
            search: { fromDate: since },
          }) || [];
        } catch (e2) {
          console.log("MediaFile Get also failed:", e2);
        }
      }

      for (const media of mediaResults) {
        const mediaDevice = deviceMap.get(media.device?.id);
        if (!mediaDevice) continue;

        const driverName = media.driver?.id ? driverMap.get(media.driver.id) : null;
        const eventTags = Array.isArray(media.tags) ? media.tags : null;

        const { error: insertErr } = await supabase
          .from("dashcam_media")
          .upsert(
            {
              geotab_media_file_id: media.id,
              instructor_id: mediaDevice.instructor_id,
              device_id: mediaDevice.id,
              media_type: media.mediaType === "Image" ? "image" : "video",
              file_name: media.name || null,
              duration_seconds: media.duration || null,
              latitude: media.latitude || null,
              longitude: media.longitude || null,
              recorded_at: media.dateTime || new Date().toISOString(),
              is_incident: eventTags?.includes("Incident") || false,
              status: "available",
              driver_id: media.driver?.id || null,
              driver_name: driverName || null,
              event_tags: eventTags,
              g_force: media.gForce ?? null,
              camera_angle: media.cameraAngle || media.channel || null,
              resolution: media.resolution || null,
              file_size_bytes: media.fileSize || null,
              processing_status: media.processingStatus || media.status || null,
              speed_at_event_kmh: media.speed ?? null,
              road_name: media.roadName || null,
            },
            { onConflict: "geotab_media_file_id" }
          );

        if (!insertErr) mediaInserted++;
      }

      if (newVersion) {
        await supabase.from("cron_sync_config").upsert({
          id: "geotab_media_feed",
          last_error: newVersion,
          last_run_at: new Date().toISOString(),
          is_enabled: true,
          interval_seconds: 10,
        });
      }
    } else {
      console.log("[GeotabPoller] Skipping media sync (last run", Math.round((Date.now() - lastMediaSyncAt) / 1000), "s ago)");
    }

    return new Response(
      JSON.stringify({
        ok: true,
        devices: devices.length,
        positionsUpdated: statusResults?.length || 0,
        mediaInserted,
        mediaSynced: shouldSyncMedia,
        impactsInserted,
        pushNotificationsSent: pushSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("geotab-poller error:", err);
    cachedSession = null; // Clear in-memory session on error

    // Clear DB-cached session if it's an auth error
    if (err.message?.includes("auth failed") || err.message?.includes("quota exceeded")) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabase.from("geotab_session_cache").delete().eq("id", "default");
      } catch (_) { /* ignore cleanup errors */ }
    }

    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
