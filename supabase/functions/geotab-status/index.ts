// Geotab on-demand status — pulls live position + StatusData diagnostics for a device.
// Accepts ?deviceId=... (Geotab device id, e.g. "b1234") or ?gpsDeviceId=<uuid> (gps_devices.id).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Common Geotab StatusData diagnostic IDs (subset). The Geotab API returns numeric values
// per diagnostic; we name the ones we care about for the vehicle health tile.
const DIAGNOSTIC_IDS: Record<string, string> = {
  DiagnosticOdometerAdjustmentId: "odometerKm",
  DiagnosticFuelLevelId: "fuelLevelPct",
  DiagnosticEngineCoolantTemperatureId: "coolantTempC",
  DiagnosticEngineOilLifeRemainingId: "oilLifePct",
  DiagnosticBatteryVoltageId: "batteryVolts",
  DiagnosticGoDeviceVoltageId: "deviceVoltage",
  DiagnosticTotalFuelUsedId: "totalFuelLitres",
  DiagnosticEngineRoadSpeedId: "speedKph",
  DiagnosticIgnitionId: "ignition",
};

async function geotabRpc(server: string, method: string, params: Record<string, unknown>) {
  const res = await fetch(`https://${server}/apiv1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params }),
  });
  const json = await res.json();
  if (json.error) {
    const err = new Error(json.error.errors?.[0]?.message ?? json.error.message ?? "Geotab RPC error");
    (err as any).geotabError = json.error;
    throw err;
  }
  return json.result;
}

async function getCreds(supabase: ReturnType<typeof createClient>, forceRefresh = false) {
  const userName = Deno.env.get("GEOTAB_USERNAME")!;
  const password = Deno.env.get("GEOTAB_PASSWORD")!;
  const database = Deno.env.get("GEOTAB_DATABASE")!;
  const cacheKey = `${userName}::${database}`;
  if (!forceRefresh) {
    const { data } = await supabase
      .from("geotab_session_cache")
      .select("server_url, session_id, expires_at")
      .eq("id", cacheKey)
      .maybeSingle();
    if (data?.session_id && data?.expires_at && new Date(data.expires_at) > new Date()) {
      return { server: data.server_url, database, userName, sessionId: data.session_id };
    }
  }
  let server = "my.geotab.com";
  let r = await geotabRpc(server, "Authenticate", { database, userName, password });
  if (r?.path && r.path !== "ThisServer") {
    server = r.path;
    r = await geotabRpc(server, "Authenticate", { database, userName, password });
  }
  const sessionId = r?.credentials?.sessionId;
  await supabase.from("geotab_session_cache").upsert(
    {
      id: cacheKey,
      server_url: server,
      session_id: sessionId,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
    },
    { onConflict: "id" },
  );
  return { server, database, userName, sessionId };
}

async function call<T>(supabase: ReturnType<typeof createClient>, method: string, typeName: string, params: Record<string, unknown>): Promise<T> {
  let c = await getCreds(supabase);
  const invoke = (cc: typeof c) =>
    geotabRpc(cc.server, method, {
      ...(typeName ? { typeName } : {}),
      ...params,
      credentials: { database: cc.database, userName: cc.userName, sessionId: cc.sessionId },
    });
  try {
    return (await invoke(c)) as T;
  } catch (err) {
    const code = (err as any)?.geotabError?.errors?.[0]?.name;
    if (code === "InvalidUserException" || code === "DbUnavailableException") {
      c = await getCreds(supabase, true);
      return (await invoke(c)) as T;
    }
    throw err;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const url = new URL(req.url);
    let geotabDeviceId = url.searchParams.get("deviceId");
    const gpsDeviceId = url.searchParams.get("gpsDeviceId");

    if (!geotabDeviceId && gpsDeviceId) {
      const { data: device } = await supabase
        .from("gps_devices")
        .select("provider_device_id, tracking_provider")
        .eq("id", gpsDeviceId)
        .maybeSingle();
      if (!device || device.tracking_provider !== "geotab") {
        return new Response(JSON.stringify({ ok: false, error: "Device not linked to Geotab" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      geotabDeviceId = device.provider_device_id;
    }

    if (!geotabDeviceId) {
      // Default: return list of devices visible to this Geotab account (proof-of-life).
      const devices = await call<any[]>(supabase, "Get", "Device", { search: { fromDate: new Date().toISOString() } });
      return new Response(
        JSON.stringify({
          ok: true,
          mode: "deviceList",
          deviceCount: Array.isArray(devices) ? devices.length : 0,
          devices: (devices ?? []).slice(0, 10).map((d: any) => ({
            id: d.id,
            name: d.name,
            serialNumber: d.serialNumber,
            vehicleIdentificationNumber: d.vehicleIdentificationNumber,
            licensePlate: d.licensePlate,
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const [statusInfo, statusData] = await Promise.all([
      call<any>(supabase, "Get", "DeviceStatusInfo", { search: { deviceSearch: { id: geotabDeviceId } } }),
      call<any[]>(supabase, "Get", "StatusData", {
        search: {
          deviceSearch: { id: geotabDeviceId },
          fromDate: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          toDate: new Date().toISOString(),
        },
        resultsLimit: 500,
      }),
    ]);

    // Reduce StatusData to latest reading per known diagnostic.
    const latestByDiag: Record<string, { value: number; dateTime: string }> = {};
    for (const row of statusData ?? []) {
      const diagId = row?.diagnostic?.id;
      if (!diagId) continue;
      const key = DIAGNOSTIC_IDS[diagId];
      if (!key) continue;
      const prev = latestByDiag[key];
      if (!prev || new Date(row.dateTime) > new Date(prev.dateTime)) {
        latestByDiag[key] = { value: row.data, dateTime: row.dateTime };
      }
    }

    const info = Array.isArray(statusInfo) ? statusInfo[0] : statusInfo;
    return new Response(
      JSON.stringify({
        ok: true,
        deviceId: geotabDeviceId,
        position: info
          ? {
              latitude: info.latitude,
              longitude: info.longitude,
              speedKph: info.speed,
              bearing: info.bearing,
              isDriving: info.isDriving,
              dateTime: info.dateTime,
            }
          : null,
        diagnostics: latestByDiag,
        statusDataPoints: (statusData ?? []).length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
