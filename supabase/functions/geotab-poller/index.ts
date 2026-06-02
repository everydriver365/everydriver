// Geotab 1-min poller — fetches incremental data per Geotab-linked device and
// upserts into the geotab_* tables. Trip rows backfill scheduled_lessons.geotab_trip_id.
// Uses geotab_sync_cursors to remember fromDate per (device_id, cursor_name).
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------- Geotab JSON-RPC helpers ----------
async function geotabRpc(server: string, method: string, params: Record<string, unknown>) {
  const res = await fetch(`https://${server}/apiv1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params }),
  });
  const json = await res.json();
  if (json.error) {
    const e = new Error(json.error.errors?.[0]?.message ?? json.error.message ?? "Geotab RPC error");
    (e as any).geotabError = json.error;
    throw e;
  }
  return json.result;
}

async function getCreds(supabase: SupabaseClient, forceRefresh = false) {
  const userName = Deno.env.get("GEOTAB_USERNAME")!;
  const password = Deno.env.get("GEOTAB_PASSWORD")!;
  const database = Deno.env.get("GEOTAB_DATABASE")!;
  if (!forceRefresh) {
    const { data } = await supabase
      .from("geotab_session_cache")
      .select("server, session_id, expires_at")
      .eq("user_name", userName)
      .eq("database", database)
      .maybeSingle();
    if (data?.session_id && data?.expires_at && new Date(data.expires_at) > new Date()) {
      return { server: data.server as string, database, userName, sessionId: data.session_id as string };
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
      user_name: userName,
      database,
      server,
      session_id: sessionId,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_name,database" },
  );
  return { server, database, userName, sessionId };
}

async function call<T>(supabase: SupabaseClient, method: string, typeName: string, params: Record<string, unknown>): Promise<T> {
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

// ---------- Cursor helpers ----------
async function getCursor(supabase: SupabaseClient, instructorId: string, name: string): Promise<string | null> {
  const { data } = await supabase
    .from("geotab_sync_cursors")
    .select("last_from_version")
    .eq("instructor_id", instructorId)
    .eq("cursor_name", name)
    .maybeSingle();
  return (data?.last_from_version as string | null) ?? null;
}

async function setCursor(
  supabase: SupabaseClient,
  instructorId: string,
  name: string,
  value: string,
  error: string | null = null,
) {
  await supabase.from("geotab_sync_cursors").upsert(
    {
      instructor_id: instructorId,
      cursor_name: name,
      last_from_version: value,
      last_run_at: new Date().toISOString(),
      last_error: error,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "instructor_id,cursor_name" },
  );
}

// ---------- Classification helpers ----------
function severityFromRule(ruleName: string | undefined | null): string {
  if (!ruleName) return "info";
  const n = ruleName.toLowerCase();
  if (n.includes("collision") || n.includes("accident") || n.includes("impact")) return "critical";
  if (n.includes("harsh") || n.includes("speeding")) return "warning";
  return "info";
}

function isImpactRule(ruleName: string | undefined | null): boolean {
  if (!ruleName) return false;
  const n = ruleName.toLowerCase();
  return n.includes("collision") || n.includes("accident") || n.includes("impact") || n.includes("possible accident");
}

function eventTypeFromRule(ruleName: string | undefined | null): string {
  if (!ruleName) return "exception";
  const n = ruleName.toLowerCase();
  if (n.includes("brake")) return "harsh_brake";
  if (n.includes("accel")) return "harsh_acceleration";
  if (n.includes("corner") || n.includes("turn")) return "harsh_cornering";
  if (n.includes("speed")) return "speeding";
  if (n.includes("seatbelt")) return "seatbelt";
  if (n.includes("idling") || n.includes("idle")) return "idling";
  return "exception";
}

// ---------- Per-device pollers ----------
interface DeviceRow {
  id: string;
  instructor_id: string;
  geotab_device_id: string;
  device_name: string | null;
}

async function pollExceptions(supabase: SupabaseClient, device: DeviceRow) {
  const cursorName = `exception:${device.geotab_device_id}`;
  const fromVer = await getCursor(supabase, device.instructor_id, cursorName);

  const params: Record<string, unknown> = {
    search: { deviceSearch: { id: device.geotab_device_id } },
    resultsLimit: 1000,
  };
  if (fromVer) {
    (params as any).fromVersion = fromVer;
  } else {
    // First run: last 24 h
    (params.search as any).fromDate = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    (params.search as any).toDate = new Date().toISOString();
  }

  let result: any;
  try {
    result = await call<any>(supabase, "GetFeed", "ExceptionEvent", params);
  } catch (err) {
    await setCursor(supabase, device.instructor_id, cursorName, fromVer ?? "", (err as Error).message);
    return { fetched: 0, exceptions: 0, impacts: 0 };
  }

  const events: any[] = result?.data ?? [];
  let driverRows = 0;
  let impactRows = 0;

  for (const ev of events) {
    const ruleName: string | undefined = ev.rule?.name;
    const startedAt = ev.activeFrom ?? ev.dateTime ?? null;
    const endedAt = ev.activeTo ?? null;
    const eventId = String(ev.id ?? "");

    if (!eventId || !startedAt) continue;

    // Driver-behaviour row (every exception goes here for the timeline)
    const { error: dErr } = await supabase.from("geotab_driver_events").upsert(
      {
        instructor_id: device.instructor_id,
        device_id: device.id,
        event_type: eventTypeFromRule(ruleName),
        rule_name: ruleName ?? null,
        severity: severityFromRule(ruleName),
        duration_seconds: typeof ev.duration === "string" ? null : ev.duration ?? null,
        started_at: startedAt,
        ended_at: endedAt,
        geotab_event_id: eventId,
      },
      { onConflict: "geotab_event_id" },
    );
    if (!dErr) driverRows++;

    // Impact passes are flagged separately
    if (isImpactRule(ruleName)) {
      const { error: iErr } = await supabase.from("geotab_impact_events").upsert(
        {
          instructor_id: device.instructor_id,
          device_id: device.id,
          event_time: startedAt,
          severity: severityFromRule(ruleName),
          acknowledged: false,
          geotab_event_id: eventId,
        },
        { onConflict: "geotab_event_id" },
      );
      if (!iErr) impactRows++;
    }
  }

  if (result?.toVersion) {
    await setCursor(supabase, device.instructor_id, cursorName, String(result.toVersion));
  }

  return { fetched: events.length, exceptions: driverRows, impacts: impactRows };
}

async function pollFaults(supabase: SupabaseClient, device: DeviceRow) {
  const cursorName = `fault:${device.geotab_device_id}`;
  const fromVer = await getCursor(supabase, device.instructor_id, cursorName);

  const params: Record<string, unknown> = {
    search: { deviceSearch: { id: device.geotab_device_id } },
    resultsLimit: 1000,
  };
  if (fromVer) {
    (params as any).fromVersion = fromVer;
  } else {
    (params.search as any).fromDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
    (params.search as any).toDate = new Date().toISOString();
  }

  let result: any;
  try {
    result = await call<any>(supabase, "GetFeed", "FaultData", params);
  } catch (err) {
    await setCursor(supabase, device.instructor_id, cursorName, fromVer ?? "", (err as Error).message);
    return { faults: 0 };
  }

  const faults: any[] = result?.data ?? [];
  let count = 0;
  for (const f of faults) {
    const code = f.diagnostic?.code ?? f.diagnostic?.name ?? null;
    const description = f.diagnostic?.name ?? null;
    const detectedAt = f.dateTime ?? null;
    const state: string | undefined = f.faultState;
    if (!code || !detectedAt) continue;

    // Active by default; if Geotab reports inactive we mark resolved.
    const isActive = state !== "Inactive";

    await supabase.from("geotab_fault_codes").insert({
      instructor_id: device.instructor_id,
      device_id: device.id,
      fault_code: String(code),
      description,
      severity: f.severity ?? null,
      source: f.controller?.name ?? null,
      detected_at: detectedAt,
      resolved_at: isActive ? null : detectedAt,
      is_active: isActive,
    });
    count++;
  }

  if (result?.toVersion) {
    await setCursor(supabase, device.instructor_id, cursorName, String(result.toVersion));
  }

  return { faults: count };
}

async function pollTrips(supabase: SupabaseClient, device: DeviceRow) {
  const cursorName = `trip:${device.geotab_device_id}`;
  const fromVer = await getCursor(supabase, device.instructor_id, cursorName);

  const params: Record<string, unknown> = {
    search: { deviceSearch: { id: device.geotab_device_id } },
    resultsLimit: 500,
  };
  if (fromVer) {
    (params as any).fromVersion = fromVer;
  } else {
    (params.search as any).fromDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();
    (params.search as any).toDate = new Date().toISOString();
  }

  let result: any;
  try {
    result = await call<any>(supabase, "GetFeed", "Trip", params);
  } catch (err) {
    await setCursor(supabase, device.instructor_id, cursorName, fromVer ?? "", (err as Error).message);
    return { trips: 0, backfilled: 0 };
  }

  const trips: any[] = result?.data ?? [];
  let backfilled = 0;

  for (const t of trips) {
    const tripId: string | undefined = t.id;
    const startTime: string | undefined = t.start;
    const stopTime: string | undefined = t.stop;
    if (!tripId || !startTime || !stopTime) continue;

    // Backfill any scheduled_lesson for this instructor whose time window
    // overlaps the trip and which doesn't yet have a geotab_trip_id.
    const { data: lessons } = await supabase
      .from("scheduled_lessons")
      .select("id, start_time, end_time, geotab_trip_id")
      .eq("instructor_id", device.instructor_id)
      .is("geotab_trip_id", null)
      .gte("end_time", startTime)
      .lte("start_time", stopTime);

    for (const lesson of lessons ?? []) {
      await supabase
        .from("scheduled_lessons")
        .update({ geotab_trip_id: tripId })
        .eq("id", (lesson as any).id);
      backfilled++;
    }
  }

  if (result?.toVersion) {
    await setCursor(supabase, device.instructor_id, cursorName, String(result.toVersion));
  }

  return { trips: trips.length, backfilled };
}

// ---------- HTTP entrypoint ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: devices, error } = await supabase
      .from("gps_devices")
      .select("id, instructor_id, geotab_device_id, device_name")
      .eq("tracking_provider", "geotab")
      .eq("is_active", true)
      .not("geotab_device_id", "is", null)
      .not("instructor_id", "is", null);

    if (error) throw error;

    const report: any[] = [];
    for (const d of (devices ?? []) as DeviceRow[]) {
      const [ex, fa, tr] = await Promise.all([
        pollExceptions(supabase, d),
        pollFaults(supabase, d),
        pollTrips(supabase, d),
      ]);
      report.push({
        deviceId: d.geotab_device_id,
        name: d.device_name,
        ...ex,
        ...fa,
        ...tr,
      });
    }

    return new Response(JSON.stringify({ ok: true, devices: report.length, report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
