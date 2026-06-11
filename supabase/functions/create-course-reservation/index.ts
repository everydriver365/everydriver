// supabase/functions/create-course-reservation/index.ts
//
// Server-side commit for the "Reserve start date only" booking flow.
//
// 1. Validates pupil inputs.
// 2. Re-runs the capacity check against live availability sources so the
//    pupil can't race the check by tweaking inputs after the client passed.
// 3. Inserts a row in public.course_reservations and returns its id.
//
// Payment integration is intentionally NOT done here yet — the caller is
// expected to follow up by attaching a payment_intent_id once the gateway
// returns. The reservation row starts as payment_status='pending'.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ReservationBody {
  instructor_id: string;
  course_id: string;
  pupil_id: string;
  start_date: string;                  // YYYY-MM-DD
  completion_window_weeks: number;
  allowed_days: number[];              // 0–6
  time_windows: ("morning" | "afternoon" | "evening")[];
  hours_per_week_cap: number;
  total_hours: number;
  pupil_notes?: string | null;
}

const TIME_WINDOW_RANGES: Record<string, { startMin: number; endMin: number }> = {
  morning:   { startMin: 8 * 60,  endMin: 12 * 60 },
  afternoon: { startMin: 12 * 60, endMin: 17 * 60 },
  evening:   { startMin: 17 * 60, endMin: 21 * 60 },
};

function parseHHMM(t: string | null | undefined): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t).trim());
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

function validate(body: any): { ok: true; data: ReservationBody } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body" };
  const required = ["instructor_id", "course_id", "pupil_id", "start_date", "completion_window_weeks",
                    "allowed_days", "time_windows", "hours_per_week_cap", "total_hours"];
  for (const k of required) if (!(k in body)) return { ok: false, error: `Missing ${k}` };
  if (!Array.isArray(body.allowed_days) || body.allowed_days.length === 0) return { ok: false, error: "allowed_days empty" };
  if (!Array.isArray(body.time_windows) || body.time_windows.length === 0) return { ok: false, error: "time_windows empty" };
  if (body.completion_window_weeks < 1 || body.completion_window_weeks > 52) return { ok: false, error: "completion_window_weeks out of range" };
  if (body.hours_per_week_cap < 1 || body.hours_per_week_cap > 60) return { ok: false, error: "hours_per_week_cap out of range" };
  if (body.total_hours < 1) return { ok: false, error: "total_hours invalid" };
  for (const w of body.time_windows) if (!(w in TIME_WINDOW_RANGES)) return { ok: false, error: `unknown time window ${w}` };
  return { ok: true, data: body as ReservationBody };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const parsed = validate(await req.json());
    if (!parsed.ok) return json({ error: parsed.error }, 400);
    const body = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Confirm the instructor has the feature enabled.
    const { data: settings, error: settingsErr } = await supabase
      .from("instructor_booking_settings")
      .select("allow_start_date_only_booking, start_date_only_max_hours_per_week")
      .eq("instructor_id", body.instructor_id)
      .maybeSingle();
    if (settingsErr) return json({ error: settingsErr.message }, 500);
    if (!settings?.allow_start_date_only_booking) {
      return json({ error: "This instructor doesn't offer start-date-only booking." }, 400);
    }
    if (settings.start_date_only_max_hours_per_week && body.hours_per_week_cap > settings.start_date_only_max_hours_per_week) {
      return json({ error: `Hours per week exceeds instructor cap of ${settings.start_date_only_max_hours_per_week}.` }, 400);
    }

    // 2. Capacity re-check.
    const start = new Date(`${body.start_date}T00:00:00Z`);
    const end = addDays(start, body.completion_window_weeks * 7);
    const fromStr = isoDay(start);
    const toStr = isoDay(end);
    const fromIso = start.toISOString();
    const toIso = addDays(end, 1).toISOString();

    const [whRes, ovRes, mbRes, ceRes] = await Promise.all([
      supabase.from("instructor_working_hours")
        .select("day_of_week, is_active, start_time, end_time")
        .eq("instructor_id", body.instructor_id),
      supabase.from("instructor_date_overrides")
        .select("override_date, override_end_date, is_available, start_time, end_time")
        .eq("instructor_id", body.instructor_id)
        .or(`override_date.gte.${fromStr},override_end_date.gte.${fromStr}`)
        .lte("override_date", toStr),
      supabase.rpc("get_public_instructor_manual_blocks", {
        p_instructor_ids: [body.instructor_id],
        p_from_datetime: fromIso,
        p_to_datetime: toIso,
      }),
      supabase.rpc("get_public_instructor_calendar_blocks", {
        p_instructor_ids: [body.instructor_id],
        p_from_datetime: fromIso,
        p_to_datetime: toIso,
      }),
    ]);
    if (whRes.error) return json({ error: whRes.error.message }, 500);

    const workingHours = (whRes.data ?? []).filter((w: any) => w.is_active);
    const overrides = (ovRes.data ?? []) as any[];
    const manualBlocks = (mbRes.data ?? []) as any[];
    const calendarEvents = (ceRes.data ?? []) as any[];

    const allowedRanges = body.time_windows.map((k) => TIME_WINDOW_RANGES[k]);
    const weeklyMinutes = new Map<number, number>();
    const msPerWeek = 7 * 24 * 3600 * 1000;

    for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
      const dow = d.getUTCDay();
      if (!body.allowed_days.includes(dow)) continue;

      const dateStr = isoDay(d);

      // Build the day's working windows: overrides take precedence, else weekly.
      let windows: { start: number; end: number }[] = [];
      const override = overrides.find((o) =>
        dateStr >= o.override_date && dateStr <= (o.override_end_date ?? o.override_date)
      );
      if (override) {
        if (!override.is_available) continue;
        const s = parseHHMM(override.start_time);
        const e = parseHHMM(override.end_time);
        if (s != null && e != null && e > s) windows = [{ start: s, end: e }];
      } else {
        for (const w of workingHours) {
          if (w.day_of_week !== dow) continue;
          const s = parseHHMM(w.start_time);
          const e = parseHHMM(w.end_time);
          if (s != null && e != null && e > s) windows.push({ start: s, end: e });
        }
      }
      if (windows.length === 0) continue;

      // Conflicts for this day (minutes-since-midnight UTC).
      const dayConflicts: { start: number; end: number }[] = [];
      const dayMs = Date.parse(`${dateStr}T00:00:00Z`);
      const pushConflict = (startMs: number, endMs: number) => {
        const s = Math.max(0, Math.floor((startMs - dayMs) / 60000));
        const e = Math.min(24 * 60, Math.ceil((endMs - dayMs) / 60000));
        if (e > s) dayConflicts.push({ start: s, end: e });
      };
      for (const b of manualBlocks) {
        const s = Date.parse(b.start_datetime);
        const e = Date.parse(b.end_datetime);
        if (e > dayMs && s < dayMs + 24 * 3600 * 1000) pushConflict(s, e);
      }
      for (const ev of calendarEvents) {
        if (ev.is_busy === false) continue;
        const s = Date.parse(ev.start_time);
        const e = Date.parse(ev.end_time);
        if (e > dayMs && s < dayMs + 24 * 3600 * 1000) pushConflict(s, e);
      }

      // For each working window, intersect with each allowed time-of-day range,
      // then subtract conflicts.
      let dayMinutes = 0;
      for (const win of windows) {
        for (const r of allowedRanges) {
          const segStart = Math.max(win.start, r.startMin);
          const segEnd = Math.min(win.end, r.endMin);
          if (segEnd <= segStart) continue;
          // Subtract overlapping conflict minutes.
          let segMinutes = segEnd - segStart;
          for (const c of dayConflicts) {
            const oStart = Math.max(segStart, c.start);
            const oEnd = Math.min(segEnd, c.end);
            if (oEnd > oStart) segMinutes -= (oEnd - oStart);
          }
          if (segMinutes > 0) dayMinutes += segMinutes;
        }
      }
      if (dayMinutes <= 0) continue;

      const weekIdx = Math.floor((d.getTime() - start.getTime()) / msPerWeek);
      weeklyMinutes.set(weekIdx, (weeklyMinutes.get(weekIdx) ?? 0) + dayMinutes);
    }

    const capMinutes = body.hours_per_week_cap * 60;
    let totalCapped = 0;
    for (const m of weeklyMinutes.values()) totalCapped += Math.min(m, capMinutes);
    const hoursAvailable = totalCapped / 60;

    if (hoursAvailable < body.total_hours) {
      return json({
        error: "Instructor doesn't have enough availability for this course in the requested window.",
        hours_available: Number(hoursAvailable.toFixed(2)),
        hours_required: body.total_hours,
      }, 409);
    }

    // 3. Insert reservation.
    const { data: inserted, error: insertErr } = await supabase
      .from("course_reservations")
      .insert({
        instructor_id: body.instructor_id,
        course_id: body.course_id,
        pupil_id: body.pupil_id,
        start_date: body.start_date,
        completion_window_weeks: body.completion_window_weeks,
        allowed_days: body.allowed_days,
        time_windows: body.time_windows,
        hours_per_week_cap: body.hours_per_week_cap,
        total_hours: body.total_hours,
        pupil_notes: body.pupil_notes ?? null,
        payment_status: "pending",
        status: "awaiting_scheduling",
      })
      .select("id")
      .single();
    if (insertErr) return json({ error: insertErr.message }, 500);

    return json({ reservation_id: inserted.id, hours_available: Number(hoursAvailable.toFixed(2)) }, 200);
  } catch (err) {
    return json({ error: (err as Error)?.message ?? "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
