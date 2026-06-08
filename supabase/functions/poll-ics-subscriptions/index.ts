// Poll all active instructor ICS subscriptions.
// Fetches each calendar URL, parses VEVENTs, mirrors them as busy events in
// instructor_calendar_events using synthetic external_event_ids so the existing
// availability engine and 20+ readers do not need to change.
//
// Runs every 5 minutes via pg_cron. Also callable on-demand from the UI.
//
// Body (optional):
//   { subscriptionId?: string }   // poll only this subscription
//   { instructorId?: string }     // poll only this instructor's subs

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const HORIZON_MONTHS = 12;
const FETCH_TIMEOUT_MS = 15_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---- Minimal ICS parser ----

interface IcsEvent {
  uid: string;
  recurrenceId: string | null;
  start: Date;
  end: Date;
  title: string | null;
  allDay: boolean;
  status: string | null;
  transp: string | null;
}

function unfold(text: string): string {
  // RFC 5545 line continuation: CRLF + space/tab.
  return text.replace(/\r?\n[ \t]/g, "");
}

function parseIcsDate(value: string, params: Record<string, string>): { date: Date; allDay: boolean } {
  const tz = params["TZID"];
  const isDateOnly = params["VALUE"] === "DATE" || /^\d{8}$/.test(value);
  if (isDateOnly) {
    // YYYYMMDD — treat as all-day at start of day UTC.
    const y = Number(value.slice(0, 4));
    const m = Number(value.slice(4, 6));
    const d = Number(value.slice(6, 8));
    return { date: new Date(Date.UTC(y, m - 1, d, 0, 0, 0)), allDay: true };
  }
  // YYYYMMDDTHHMMSS[Z]
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return { date: new Date(NaN), allDay: false };
  const [, Y, Mo, D, H, Mi, S, Z] = m;
  if (Z === "Z") {
    return {
      date: new Date(Date.UTC(+Y, +Mo - 1, +D, +H, +Mi, +S)),
      allDay: false,
    };
  }
  if (tz) {
    // Best-effort: build an instant by treating wall-clock as UTC then offsetting
    // for Europe/London. For other TZs we accept slight inaccuracy — Google's
    // ICS feeds nearly always use Z for non-floating events.
    const utc = new Date(Date.UTC(+Y, +Mo - 1, +D, +H, +Mi, +S));
    if (tz === "Europe/London" || tz === "GMT" || tz === "BST") {
      const offsetMin = londonOffsetMinutes(utc); // negative of what to subtract
      return { date: new Date(utc.getTime() - offsetMin * 60_000), allDay: false };
    }
    return { date: utc, allDay: false }; // fallback
  }
  // Floating local — treat as Europe/London wall clock.
  const utc = new Date(Date.UTC(+Y, +Mo - 1, +D, +H, +Mi, +S));
  const offsetMin = londonOffsetMinutes(utc);
  return { date: new Date(utc.getTime() - offsetMin * 60_000), allDay: false };
}

function londonOffsetMinutes(utc: Date): number {
  // Returns offset of Europe/London at this UTC moment, in minutes (+60 for BST, 0 for GMT).
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(utc);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return Math.round((wall - utc.getTime()) / 60_000);
}

function parseIcs(text: string): IcsEvent[] {
  const unfolded = unfold(text);
  const lines = unfolded.split(/\r?\n/);
  const events: IcsEvent[] = [];
  let cur: Partial<IcsEvent> | null = null;
  let curStartParams: Record<string, string> = {};
  let curEndParams: Record<string, string> = {};
  let startVal = "";
  let endVal = "";
  let durVal = "";

  for (const raw of lines) {
    if (raw === "BEGIN:VEVENT") {
      cur = { uid: "", recurrenceId: null, title: null, allDay: false, status: null, transp: null };
      curStartParams = {};
      curEndParams = {};
      startVal = endVal = durVal = "";
      continue;
    }
    if (raw === "END:VEVENT") {
      if (cur && cur.uid && startVal) {
        const s = parseIcsDate(startVal, curStartParams);
        let e: { date: Date; allDay: boolean };
        if (endVal) {
          e = parseIcsDate(endVal, curEndParams);
        } else if (durVal) {
          // Very simple DURATION parser: PT#H#M
          const m = durVal.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
          const hours = m?.[1] ? Number(m[1]) : 0;
          const mins = m?.[2] ? Number(m[2]) : 0;
          e = { date: new Date(s.date.getTime() + (hours * 60 + mins) * 60_000), allDay: s.allDay };
        } else {
          // All-day default 1 day; timed default 1 hour.
          e = {
            date: new Date(s.date.getTime() + (s.allDay ? 24 * 60 : 60) * 60_000),
            allDay: s.allDay,
          };
        }
        if (!isNaN(s.date.getTime()) && !isNaN(e.date.getTime())) {
          events.push({
            uid: cur.uid!,
            recurrenceId: cur.recurrenceId ?? null,
            start: s.date,
            end: e.date,
            title: cur.title ?? null,
            allDay: s.allDay,
            status: cur.status ?? null,
            transp: cur.transp ?? null,
          });
        }
      }
      cur = null;
      continue;
    }
    if (!cur) continue;

    // Split key[;params]:value
    const colonIdx = raw.indexOf(":");
    if (colonIdx < 0) continue;
    const left = raw.slice(0, colonIdx);
    const value = raw.slice(colonIdx + 1);
    const [name, ...paramParts] = left.split(";");
    const params: Record<string, string> = {};
    for (const p of paramParts) {
      const eq = p.indexOf("=");
      if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1);
    }

    switch (name.toUpperCase()) {
      case "UID": cur.uid = value; break;
      case "SUMMARY": cur.title = value.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\"); break;
      case "RECURRENCE-ID": cur.recurrenceId = value; break;
      case "DTSTART": startVal = value; curStartParams = params; break;
      case "DTEND": endVal = value; curEndParams = params; break;
      case "DURATION": durVal = value; break;
      case "STATUS": cur.status = value; break;
      case "TRANSP": cur.transp = value; break;
    }
  }
  return events;
}

// ---- Poll one subscription ----

async function pollOne(supabase: ReturnType<typeof createClient>, sub: { id: string; instructor_id: string; url: string }) {
  const startedAt = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  let text = "";
  let status = "ok";
  let errMsg: string | null = null;
  let httpStatus: number | null = null;
  let bytesFetched: number | null = null;
  let eventsParsed = 0;
  let eventsInserted = 0;
  let eventsUpdated = 0;
  let eventsDeleted = 0;
  let eventsSkipped = 0;
  const insertedUids: Array<{ uid: string; title: string | null; start: string; end: string }> = [];
  const skippedUids: Array<{ uid: string; reason: string; title?: string | null }> = [];
  const parseErrors: Array<{ uid?: string; reason: string }> = [];

  try {
    let url = sub.url.trim();
    if (url.startsWith("webcal://")) url = "https://" + url.slice("webcal://".length);
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "DSM-ICS-Poller/1.0" } });
    httpStatus = res.status;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = await res.text();
    bytesFetched = text.length;
  } catch (e) {
    status = "error";
    errMsg = (e as Error).message || "fetch failed";
  } finally {
    clearTimeout(timer);
  }

  if (status === "ok") {
    const horizon = new Date();
    horizon.setMonth(horizon.getMonth() + HORIZON_MONTHS);
    const past = new Date();
    past.setDate(past.getDate() - 7);

    let all: IcsEvent[] = [];
    try {
      all = parseIcs(text);
    } catch (e) {
      status = "error";
      errMsg = `parse: ${(e as Error).message}`;
      parseErrors.push({ reason: errMsg });
    }
    eventsParsed = all.length;

    const events: IcsEvent[] = [];
    for (const e of all) {
      if (e.status === "CANCELLED") { skippedUids.push({ uid: e.uid, title: e.title, reason: "cancelled" }); continue; }
      if (e.transp === "TRANSPARENT") { skippedUids.push({ uid: e.uid, title: e.title, reason: "transparent" }); continue; }
      if (e.end <= past) { skippedUids.push({ uid: e.uid, title: e.title, reason: "past" }); continue; }
      if (e.start >= horizon) { skippedUids.push({ uid: e.uid, title: e.title, reason: "beyond horizon" }); continue; }
      events.push(e);
    }

    const seenExternalIds: string[] = [];
    const rows = events.map((e) => {
      const externalId = `ics:${sub.id}:${e.uid}${e.recurrenceId ? ":" + e.recurrenceId : ""}`;
      seenExternalIds.push(externalId);
      insertedUids.push({
        uid: e.uid + (e.recurrenceId ? `@${e.recurrenceId}` : ""),
        title: e.title,
        start: e.start.toISOString(),
        end: e.end.toISOString(),
      });
      return {
        instructor_id: sub.instructor_id,
        external_event_id: externalId,
        title: e.title ?? "Busy",
        start_time: e.start.toISOString(),
        end_time: e.end.toISOString(),
        is_busy: true,
        synced_at: new Date().toISOString(),
      };
    });

    // Identify pre-existing ids to compute inserted vs updated.
    let preExisting = new Set<string>();
    if (status === "ok") {
      const prefix = `ics:${sub.id}:`;
      const { data: existing } = await supabase
        .from("instructor_calendar_events")
        .select("external_event_id")
        .eq("instructor_id", sub.instructor_id)
        .like("external_event_id", `${prefix}%`);
      preExisting = new Set((existing ?? []).map((r: any) => r.external_event_id as string));

      if (rows.length > 0) {
        const { error: upErr } = await supabase
          .from("instructor_calendar_events")
          .upsert(rows, { onConflict: "instructor_id,external_event_id" });
        if (upErr) {
          status = "error";
          errMsg = `upsert: ${upErr.message}`;
        } else {
          for (const id of seenExternalIds) {
            if (preExisting.has(id)) eventsUpdated++;
            else eventsInserted++;
          }
        }
      }

      if (status === "ok") {
        const stale = Array.from(preExisting).filter((id) => !seenExternalIds.includes(id));
        if (stale.length > 0) {
          const { error: delErr } = await supabase
            .from("instructor_calendar_events")
            .delete()
            .eq("instructor_id", sub.instructor_id)
            .in("external_event_id", stale);
          if (!delErr) eventsDeleted = stale.length;
        }
      }
    }
  }

  const durationMs = Date.now() - startedAt;

  await supabase
    .from("instructor_ics_subscriptions")
    .update({
      last_polled_at: new Date().toISOString(),
      last_status: status,
      last_error: errMsg,
      last_event_count: eventsParsed,
    })
    .eq("id", sub.id);

  // Cap arrays to keep row payload bounded.
  const cap = <T,>(arr: T[], n = 200) => arr.slice(0, n);

  await supabase.from("instructor_ics_poll_runs").insert({
    subscription_id: sub.id,
    instructor_id: sub.instructor_id,
    duration_ms: durationMs,
    http_status: httpStatus,
    status,
    error: errMsg,
    bytes_fetched: bytesFetched,
    events_parsed: eventsParsed,
    events_inserted: eventsInserted,
    events_updated: eventsUpdated,
    events_deleted: eventsDeleted,
    events_skipped: skippedUids.length,
    inserted_uids: cap(insertedUids),
    skipped_uids: cap(skippedUids),
    parse_errors: parseErrors,
  });

  return { subscriptionId: sub.id, status, eventsParsed, eventsInserted, eventsUpdated, eventsDeleted, eventsSkipped: skippedUids.length, error: errMsg };
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  let body: { subscriptionId?: string; instructorId?: string } = {};
  try { body = await req.json(); } catch {}

  let q = supabase
    .from("instructor_ics_subscriptions")
    .select("id, instructor_id, url")
    .eq("is_active", true);

  if (body.subscriptionId) q = q.eq("id", body.subscriptionId);
  else if (body.instructorId) q = q.eq("instructor_id", body.instructorId);

  const { data: subs, error } = await q;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results = [];
  // Sequential for safety (per-instructor) — quantity is small.
  for (const s of subs ?? []) {
    results.push(await pollOne(supabase, s as any));
  }

  return new Response(JSON.stringify({ polled: results.length, results }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
