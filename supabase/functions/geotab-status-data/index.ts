import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

// Well-known Geotab diagnostic IDs for engine sensors
const DIAGNOSTIC_MAP: Record<string, { id: string; label: string; unit: string }> = {
  rpm: { id: "DiagnosticEngineSpeedId", label: "Engine RPM", unit: "rpm" },
  throttle: { id: "DiagnosticThrottlePositionId", label: "Throttle Position", unit: "%" },
  oilPressure: { id: "DiagnosticEngineOilPressureId", label: "Oil Pressure", unit: "kPa" },
  coolantTemp: { id: "DiagnosticCoolantTemperatureId", label: "Coolant Temp", unit: "°C" },
  fuelLevel: { id: "DiagnosticFuelLevelId", label: "Fuel Level", unit: "%" },
  batteryVoltage: { id: "DiagnosticBatteryVoltageId", label: "Battery Voltage", unit: "V" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { instructorId, fromDate, toDate, diagnostics } = await req.json();

    // Resolve instructor
    let targetInstructorId = instructorId;
    if (!targetInstructorId) {
      const { data: inst } = await supabase
        .from("instructors")
        .select("id")
        .eq("auth_user_id", userId)
        .maybeSingle();
      if (inst) targetInstructorId = inst.id;
    }

    if (!targetInstructorId) {
      return new Response(
        JSON.stringify({ error: "No instructor found for user" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Geotab devices
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: devices, error: devErr } = await adminClient
      .from("gps_devices")
      .select("id, geotab_device_id, device_name")
      .eq("instructor_id", targetInstructorId)
      .eq("tracking_provider", "geotab")
      .not("geotab_device_id", "is", null);

    if (devErr) throw devErr;
    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ series: [], message: "No Geotab devices" }),
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

    const from = fromDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const to = toDate || new Date().toISOString();

    // Which diagnostics to fetch (default: rpm, throttle, oilPressure)
    const requestedDiags: string[] = diagnostics && diagnostics.length > 0
      ? diagnostics
      : ["rpm", "throttle", "oilPressure"];

    const series: Record<string, { label: string; unit: string; data: { time: string; value: number }[] }> = {};

    for (const diagKey of requestedDiags) {
      const diagInfo = DIAGNOSTIC_MAP[diagKey];
      if (!diagInfo) continue;

      series[diagKey] = { label: diagInfo.label, unit: diagInfo.unit, data: [] };

      for (const device of devices) {
        const internalId =
          serialToInternal.get(device.geotab_device_id) || device.geotab_device_id;

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
          console.warn(`[geotab-status-data] Failed to fetch ${diagKey} for device ${internalId}:`, e.message);
        }
      }

      // Sort by time
      series[diagKey].data.sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
      );
    }

    return new Response(JSON.stringify({ series }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[geotab-status-data] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
