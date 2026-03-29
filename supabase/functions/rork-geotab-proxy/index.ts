import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_INSTRUCTOR_ID = "b7987d5e-348f-4047-a8d4-ee71fab1f01d";

interface GeotabSession {
  sessionId: string;
  serverUrl: string;
  expiresAt: number;
}

let cachedSession: GeotabSession | null = null;

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
  const resolvedPath =
    !path || path.toLowerCase() === "thisserver" ? "my.geotab.com" : path;

  cachedSession = {
    sessionId: credentials.sessionId,
    serverUrl: `https://${resolvedPath}/apiv1`,
    expiresAt: Date.now() + 20 * 60 * 1000,
  };

  return cachedSession;
}

async function geotabCall(
  session: GeotabSession,
  method: string,
  params: Record<string, unknown>
) {
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
  if (data.error)
    throw new Error(`Geotab ${method} failed: ${data.error.message}`);
  return data.result;
}

const DIAGNOSTIC_MAP: Record<string, { id: string; label: string; unit: string }> = {
  rpm: { id: "DiagnosticEngineSpeedId", label: "Engine RPM", unit: "rpm" },
  throttle: { id: "DiagnosticThrottlePositionId", label: "Throttle Position", unit: "%" },
  oilPressure: { id: "DiagnosticEngineOilPressureId", label: "Oil Pressure", unit: "kPa" },
  coolantTemp: { id: "DiagnosticCoolantTemperatureId", label: "Coolant Temp", unit: "°C" },
  fuelLevel: { id: "DiagnosticFuelLevelId", label: "Fuel Level", unit: "%" },
  batteryVoltage: { id: "DiagnosticBatteryVoltageId", label: "Battery Voltage", unit: "V" },
  odometer: { id: "DiagnosticOdometerReadingId", label: "Odometer", unit: "km" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, instructorId, fromDate, toDate, diagnostics } = await req.json();

    // Validate instructor — only the hardcoded ID is allowed
    if (instructorId !== ALLOWED_INSTRUCTOR_ID) {
      return new Response(
        JSON.stringify({ error: "Unauthorized instructor" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!action || !["trips", "faults", "status"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use: trips, faults, status" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get Geotab devices for instructor
    const { data: devices, error: devErr } = await adminClient
      .from("gps_devices")
      .select("id, geotab_device_id, device_name")
      .eq("instructor_id", instructorId)
      .eq("tracking_provider", "geotab")
      .not("geotab_device_id", "is", null);

    if (devErr) throw devErr;
    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ data: [], message: "No Geotab devices" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const session = await authenticate();

    // Resolve serial numbers to internal IDs
    const geotabDevices = await geotabCall(session, "Get", { typeName: "Device" });
    const serialToInternal = new Map<string, string>();
    for (const gd of geotabDevices || []) {
      if (gd.serialNumber) serialToInternal.set(gd.serialNumber, gd.id);
    }

    const from = fromDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const to = toDate || new Date().toISOString();

    let result: unknown;

    if (action === "trips") {
      result = await handleTrips(session, devices, serialToInternal, from, to);
    } else if (action === "faults") {
      result = await handleFaults(session, devices, serialToInternal, from, to);
    } else if (action === "status") {
      const requestedDiags = diagnostics?.length ? diagnostics : ["rpm", "fuelLevel", "coolantTemp"];
      result = await handleStatus(session, devices, serialToInternal, from, to, requestedDiags);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[rork-geotab-proxy] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleTrips(
  session: GeotabSession,
  devices: Array<{ geotab_device_id: string; device_name: string }>,
  serialToInternal: Map<string, string>,
  from: string,
  to: string
) {
  const trips: Array<Record<string, unknown>> = [];

  for (const device of devices) {
    const internalId = serialToInternal.get(device.geotab_device_id) || device.geotab_device_id;
    try {
      const tripData = await geotabCall(session, "Get", {
        typeName: "Trip",
        search: {
          deviceSearch: { id: internalId },
          fromDate: from,
          toDate: to,
        },
        resultsLimit: 500,
      });

      for (const t of tripData || []) {
        trips.push({
          startTime: t.start,
          endTime: t.stop,
          distance: t.distance,
          drivingDuration: t.drivingDuration,
          idleDuration: t.idleDuration,
          maxSpeed: t.speedRange,
          deviceName: device.device_name || device.geotab_device_id,
        });
      }
    } catch (e) {
      console.warn(`[rork-geotab-proxy] Trip fetch failed for ${internalId}:`, e.message);
    }
  }

  trips.sort((a, b) => new Date(b.startTime as string).getTime() - new Date(a.startTime as string).getTime());
  return { trips };
}

async function handleFaults(
  session: GeotabSession,
  devices: Array<{ geotab_device_id: string; device_name: string }>,
  serialToInternal: Map<string, string>,
  from: string,
  to: string
) {
  const faults: Array<Record<string, unknown>> = [];

  for (const device of devices) {
    const internalId = serialToInternal.get(device.geotab_device_id) || device.geotab_device_id;
    try {
      const faultData = await geotabCall(session, "Get", {
        typeName: "FaultData",
        search: {
          deviceSearch: { id: internalId },
          fromDate: from,
          toDate: to,
        },
        resultsLimit: 500,
      });

      for (const fd of faultData || []) {
        faults.push({
          code: fd.diagnostic?.code || fd.id || "Unknown",
          description: fd.diagnostic?.name || fd.name || "Unknown fault",
          severity: fd.failureModeId?.name === "Critical" ? "high" :
                    fd.failureModeId?.name === "Warning" ? "medium" : "low",
          dateTime: fd.dateTime || fd.date || null,
          deviceName: device.device_name || device.geotab_device_id,
          source: fd.diagnostic?.source?.name || "Engine",
        });
      }
    } catch (e) {
      console.warn(`[rork-geotab-proxy] Fault fetch failed for ${internalId}:`, e.message);
    }
  }

  faults.sort((a, b) => new Date(b.dateTime as string).getTime() - new Date(a.dateTime as string).getTime());
  return { faults };
}

async function handleStatus(
  session: GeotabSession,
  devices: Array<{ geotab_device_id: string; device_name: string }>,
  serialToInternal: Map<string, string>,
  from: string,
  to: string,
  requestedDiags: string[]
) {
  const series: Record<string, { label: string; unit: string; data: { time: string; value: number }[] }> = {};

  for (const diagKey of requestedDiags) {
    const diagInfo = DIAGNOSTIC_MAP[diagKey];
    if (!diagInfo) continue;

    series[diagKey] = { label: diagInfo.label, unit: diagInfo.unit, data: [] };

    for (const device of devices) {
      const internalId = serialToInternal.get(device.geotab_device_id) || device.geotab_device_id;
      try {
        const statusData = await geotabCall(session, "Get", {
          typeName: "StatusData",
          search: {
            deviceSearch: { id: internalId },
            diagnosticSearch: { id: diagInfo.id },
            fromDate: from,
            toDate: to,
          },
          resultsLimit: 2000,
        });

        for (const sd of statusData || []) {
          series[diagKey].data.push({
            time: sd.dateTime || sd.date || null,
            value: sd.data ?? 0,
          });
        }
      } catch (e) {
        console.warn(`[rork-geotab-proxy] Status ${diagKey} failed for ${internalId}:`, e.message);
      }
    }

    series[diagKey].data.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }

  return { series };
}
