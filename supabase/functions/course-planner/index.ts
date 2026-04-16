import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]; // index = JS getDay()

interface DayWindow {
  enabled: boolean;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

interface PlannerRequest {
  instructor_id?: string | null;
  test_date: string;             // "YYYY-MM-DD"
  test_time?: string | null;     // "HH:MM"
  hours_remaining: number;
  lesson_length_minutes?: number;
  lessons_per_week?: number;
  weekly_availability: Record<DayKey, DayWindow>;
  start_no_earlier_than?: string | null; // "YYYY-MM-DD" — defaults to today
  preferred_start_time?: string | null;  // "HH:MM" optional anchor
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}
function toTimeStr(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function diffDays(aIso: string, bIso: string): number {
  const a = Date.parse(aIso + "T00:00:00Z");
  const b = Date.parse(bIso + "T00:00:00Z");
  return Math.floor((b - a) / 86400000);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as PlannerRequest;
    const {
      instructor_id,
      test_date,
      test_time,
      hours_remaining,
      lesson_length_minutes = 120,
      lessons_per_week = 2,
      weekly_availability,
      start_no_earlier_than,
      preferred_start_time,
    } = body;

    if (!test_date || !hours_remaining || !weekly_availability) {
      return new Response(
        JSON.stringify({ error: "test_date, hours_remaining and weekly_availability are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const earliestStart = start_no_earlier_than && start_no_earlier_than > today ? start_no_earlier_than : today;

    if (test_date <= earliestStart) {
      return new Response(
        JSON.stringify({ error: "Test date must be in the future" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- Load instructor busy slots if we have one ----
    type Busy = { date: string; startMin: number; endMin: number };
    const busyByDate: Record<string, Busy[]> = {};

    if (instructor_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      // Existing scheduled lessons (these include synced Google Calendar events too,
      // since calendar_events references scheduled_lessons. Plus we read calendar_events
      // for any non-lesson Google events).
      const [lessonsRes, calRes] = await Promise.all([
        supabase
          .from("scheduled_lessons")
          .select("lesson_date, start_time, duration_minutes, status")
          .eq("instructor_id", instructor_id)
          .gte("lesson_date", earliestStart)
          .lte("lesson_date", test_date)
          .neq("status", "cancelled"),
        // Non-lesson calendar holds (we treat any event with no lesson_id as a busy block at unknown time;
        // we can only know specific times for lesson-linked events, which we already cover above).
        supabase
          .from("calendar_events")
          .select("event_type, lesson_id")
          .eq("instructor_id", instructor_id)
          .is("lesson_id", null)
          .limit(1), // existence check; detailed Google event times aren't stored locally
      ]);

      for (const l of lessonsRes.data || []) {
        const start = toMinutes((l.start_time as string) || "00:00");
        const end = start + ((l.duration_minutes as number) || 60);
        const date = l.lesson_date as string;
        if (!busyByDate[date]) busyByDate[date] = [];
        busyByDate[date].push({ date, startMin: start, endMin: end });
      }
      // calRes existence is informational only — we don't have per-event start times in our cache.
    }

    // ---- Compute candidate slots ----
    // Strategy: walk forward day-by-day from earliestStart up to (test_date - 1).
    // For each enabled weekday, pick the EARLIEST contiguous lesson_length window
    // that doesn't overlap any busy block. Cap to lessons_per_week per ISO week.
    const enabledDays = DAY_KEYS.filter((k) => weekly_availability[k]?.enabled);
    if (enabledDays.length === 0) {
      return new Response(
        JSON.stringify({ error: "Select at least one available day" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const totalMinutesNeeded = Math.round(hours_remaining * 60);
    const lessonMin = lesson_length_minutes;
    const lessonsNeeded = Math.ceil(totalMinutesNeeded / lessonMin);

    type Slot = { date: string; start_time: string; end_time: string; duration_minutes: number };
    const slots: Slot[] = [];

    // Track lessons booked per ISO-week for the cap
    const weekCounter: Record<string, number> = {};
    const weekKey = (iso: string) => {
      const d = new Date(iso + "T00:00:00Z");
      const day = (d.getUTCDay() + 6) % 7; // Mon=0
      d.setUTCDate(d.getUTCDate() - day);
      return d.toISOString().slice(0, 10);
    };

    let cursor = earliestStart;
    let firstSlotDate: string | null = null;

    // Hard ceiling: walk at most until day before test
    const lastUsableDate = addDaysISO(test_date, -1);
    let safety = 366; // up to a year of search

    while (cursor <= lastUsableDate && slots.length < lessonsNeeded && safety-- > 0) {
      const jsDay = new Date(cursor + "T00:00:00Z").getUTCDay(); // 0..6
      const dayKey = DAY_KEYS[jsDay];
      const window = weekly_availability[dayKey];

      if (window?.enabled) {
        const wk = weekKey(cursor);
        const usedThisWeek = weekCounter[wk] || 0;
        if (usedThisWeek < lessons_per_week) {
          const winStart = toMinutes(window.start);
          const winEnd = toMinutes(window.end);
          const anchor = preferred_start_time ? toMinutes(preferred_start_time) : winStart;
          const candidateStart = Math.max(winStart, anchor);

          // Find first non-overlapping slot of length lessonMin
          const busy = (busyByDate[cursor] || []).slice().sort((a, b) => a.startMin - b.startMin);
          let tryStart = candidateStart;
          let placed = false;
          for (let attempt = 0; attempt < 24; attempt++) {
            const tryEnd = tryStart + lessonMin;
            if (tryEnd > winEnd) break;
            const overlap = busy.find((b) => tryStart < b.endMin && tryEnd > b.startMin);
            if (!overlap) {
              slots.push({
                date: cursor,
                start_time: toTimeStr(tryStart),
                end_time: toTimeStr(tryEnd),
                duration_minutes: lessonMin,
              });
              if (!firstSlotDate) firstSlotDate = cursor;
              weekCounter[wk] = usedThisWeek + 1;
              placed = true;
              break;
            }
            tryStart = overlap.endMin; // jump past the conflict and retry
          }
          // also ensure we don't double-book what we just placed for the same date
          if (placed) {
            if (!busyByDate[cursor]) busyByDate[cursor] = [];
            const last = slots[slots.length - 1];
            busyByDate[cursor].push({
              date: cursor,
              startMin: toMinutes(last.start_time),
              endMin: toMinutes(last.end_time),
            });
          }
        }
      }

      cursor = addDaysISO(cursor, 1);
    }

    const minutesScheduled = slots.length * lessonMin;
    const shortfallMinutes = Math.max(0, totalMinutesNeeded - minutesScheduled);
    const feasible = shortfallMinutes === 0;

    // Build a human-readable weekly pattern summary
    const dayLabels: Record<DayKey, string> = {
      mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
    };
    const patternDays = enabledDays.map((k) => ({
      day: dayLabels[k],
      window: `${weekly_availability[k].start}–${weekly_availability[k].end}`,
    }));

    const pattern_summary = {
      lessons_per_week,
      lesson_length_minutes: lessonMin,
      days: patternDays,
      first_lesson_date: firstSlotDate,
      last_lesson_date: slots.length ? slots[slots.length - 1].date : null,
      lessons_scheduled: slots.length,
      lessons_needed: lessonsNeeded,
    };

    return new Response(
      JSON.stringify({
        feasible,
        shortfall_hours: Math.round((shortfallMinutes / 60) * 10) / 10,
        suggested_start_date: firstSlotDate,
        pattern_summary,
        slots,
        days_until_test: diffDays(earliestStart, test_date),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("course-planner error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
