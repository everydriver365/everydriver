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

async function authenticate(): Promise<GeotabSession> {
  if (cachedSession && cachedSession.expiresAt > Date.now()) {
    return cachedSession;
  }

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

  console.log("[GeotabPoller] Authenticated, server:", resolvedPath);

  cachedSession = {
    sessionId: credentials.sessionId,
    serverUrl: `https://${resolvedPath}/apiv1`,
    expiresAt: Date.now() + 20 * 60 * 1000,
  };

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const session = await authenticate();
    const deviceMap = new Map(devices.map((d) => [d.geotab_device_id, d]));

    // Get cached device ID mappings (only hits Geotab API every 5 min)
    const { serialToInternal, internalToSerial } = await getDeviceMaps(session);

    // Resolve our serial-based IDs to Geotab internal IDs
    const resolvedGeotabIds: string[] = [];
    for (const d of devices) {
      const internalId = serialToInternal.get(d.geotab_device_id);
      resolvedGeotabIds.push(internalId || d.geotab_device_id);
    }

    // ---- BATCHED CALL: DeviceStatusInfo + PostedRoadSpeed + StatusData + FaultData in ONE request ----
    const now = new Date();
    const twoMinAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Diagnostic IDs we want from Geotab StatusData
    const diagnosticIds = [
      "DiagnosticFuelLevelId",
      "DiagnosticStateOfChargeId",            // 12V battery voltage
      "DiagnosticEngineCoolantTemperatureId",
      "DiagnosticEngineHoursAdjustmentId",
      "DiagnosticOdometerAdjustmentId",
      "DiagnosticTirePressureFrontLeftId",
      "DiagnosticTirePressureFrontRightId",
      "DiagnosticTirePressureRearLeftId",
      "DiagnosticTirePressureRearRightId",
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

    // Add StatusData calls for each device (calls N+1..2N)
    for (const gid of resolvedGeotabIds) {
      batchCalls.push({
        method: "Get",
        params: {
          typeName: "StatusData",
          search: {
            deviceSearch: { id: gid },
            diagnosticSearch: { id: diagnosticIds[0] }, // Will get all if we use separate calls
            fromDate: twoMinAgo.toISOString(),
            toDate: now.toISOString(),
          },
          resultsLimit: 50,
        },
      });
    }

    // Add FaultData call for all devices (single call at end)
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

    // StatusData results: one per device, starting after speed limit calls
    const statusDataOffset = 1 + speedLimitCallCount;
    const deviceDiagnostics = new Map<string, Record<string, number>>();
    for (let i = 0; i < resolvedGeotabIds.length; i++) {
      const sdResults: any[] = batchResults[statusDataOffset + i] || [];
      const diags: Record<string, number> = {};
      for (const sd of sdResults) {
        if (sd.diagnostic?.id && sd.data != null) {
          // Keep latest value per diagnostic
          diags[sd.diagnostic.id] = sd.data;
        }
      }
      if (Object.keys(diags).length > 0) {
        deviceDiagnostics.set(resolvedGeotabIds[i], diags);
      }
    }

    // FaultData results: last call
    const faultResults: any[] = batchResults[batchResults.length - 1] || [];
    const deviceFaults = new Map<string, any[]>();
    for (const fault of faultResults) {
      const faultDeviceId = fault.device?.id;
      if (!faultDeviceId) continue;
      if (!deviceFaults.has(faultDeviceId)) deviceFaults.set(faultDeviceId, []);
      deviceFaults.get(faultDeviceId)!.push({
        code: fault.code || fault.id,
        description: fault.name || fault.diagnostic?.name || "Unknown fault",
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
      if (diags["DiagnosticFuelLevelId"] != null) {
        diagnosticsUpdate.last_fuel_percent = Math.round(diags["DiagnosticFuelLevelId"] * 100) / 100;
      }
      if (diags["DiagnosticStateOfChargeId"] != null) {
        diagnosticsUpdate.last_battery_voltage = Math.round(diags["DiagnosticStateOfChargeId"] * 100) / 100;
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
      const tirePressure: Record<string, number> = {};
      if (diags["DiagnosticTirePressureFrontLeftId"] != null) tirePressure.frontLeft = diags["DiagnosticTirePressureFrontLeftId"];
      if (diags["DiagnosticTirePressureFrontRightId"] != null) tirePressure.frontRight = diags["DiagnosticTirePressureFrontRightId"];
      if (diags["DiagnosticTirePressureRearLeftId"] != null) tirePressure.rearLeft = diags["DiagnosticTirePressureRearLeftId"];
      if (diags["DiagnosticTirePressureRearRightId"] != null) tirePressure.rearRight = diags["DiagnosticTirePressureRearRightId"];
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
          last_ignition_status: status.isDeviceCommunicating ?? null,
          last_seen_at: geotabSeenAt
            ? new Date(geotabSeenAt).toISOString()
            : null,
          last_heartbeat_at: new Date().toISOString(),
          last_road_name: roadName,
          last_speed_limit_kmh: speedLimitKmh,
          ...diagnosticsUpdate,
        })
        .eq("id", device.id);

      // If device has an active session, record GPS point for route history
      const { data: deviceRow } = await supabase
        .from("gps_devices")
        .select("current_session_id")
        .eq("id", device.id)
        .single();

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

        // Increment distance: speed (km/h) * 10s interval / 3600
        if (status.speed > 0) {
          const distKm = (status.speed * 10) / 3600;
          if (distKm > 0.001) {
            await supabase.rpc("increment_total_distance", {
              p_id: deviceRow.current_session_id,
              p_distance: distKm,
            });
          }
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

    if (shouldSyncMedia) {
      // timestamp updated via cron_sync_config upsert below
      console.log("[GeotabPoller] Running media sync");

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
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("geotab-poller error:", err);
    cachedSession = null; // Clear session on error to force re-auth
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
