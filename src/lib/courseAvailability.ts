// =============================================================================
// courseAvailability.ts
// =============================================================================
//
// Day-level data loader + window shaper that sits on top of the canonical
// availability engine in `./availabilityEngine.ts`.
//
// STRICT RULES (do not violate):
//   - This file MUST NOT decide whether a slot is bookable. The only
//     functions that make that decision are `resolveAvailability` and
//     `validateSlot` in the engine. Here we only load rows, shape working
//     windows, build per-day conflict lists, and call the engine.
//   - NO default availability. If working hours are missing or unparseable
//     for a day, the instructor is NOT available that day — never substitute
//     08:00–20:00 or any other fallback.
//   - Single clock: Europe/London. All date/day/today decisions go through
//     the engine's London helpers, never `day.getDay()` or `new Date()`
//     wall-clock methods.
//
// Busyness sources (ONLY):
//   - instructor_calendar_events (Google Calendar mirror) + instructor_manual_blocks.
//   - scheduled_lessons is CRM data and is NEVER consulted for "is the
//     instructor busy?". Lesson geo is used ONLY for optional travel-time
//     padding around lessons that ARE present in the Google mirror.

import { format, addDays, startOfDay } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  TRAVEL_FALLBACK_MIN,
  resolveAvailability,
  buildDayConflicts,
  mergeIntervals,
  parseHHMM,
  londonTodayStr,
  londonDateStr,
  londonDow,
  type TimeOfDay,
  type Slot,
  type RejectedSlot,
  type TaggedConflict,
} from "./availabilityEngine";
import { estimateDriveMinutes } from "./travelTime";

export { TRAVEL_FALLBACK_MIN };

// ---------------------------------------------------------------------------
// Row types (mirror DB schema)
// ---------------------------------------------------------------------------

export type WeeklyHourRow = {
  instructor_id: string;
  day_of_week: number;    // instructor_working_hours: 0=Sun..6=Sat
  is_active: boolean;
  start_time?: string | null;
  end_time?: string | null;
};

export type DateOverrideRow = {
  instructor_id: string;
  override_date: string;        // yyyy-MM-dd
  override_end_date?: string | null;
  is_available: boolean;
  start_time?: string | null;
  end_time?: string | null;
};

export type CalendarEventRow = {
  instructor_id: string;
  start_time: string;   // ISO
  end_time: string;     // ISO
  /** Normalised by the loader: `null`/`undefined` → `true` (fail closed). */
  is_busy: boolean;
};

export type ManualBlockRow = {
  instructor_id: string;
  start_datetime: string;
  end_datetime: string;
};

/**
 * Coords-only view of a booked lesson — used ONLY for inter-lesson travel
 * padding. Busyness still comes from the calendar event (rule 5); this row
 * just supplies the location metadata that GCal doesn't carry.
 */
export type BookedLessonGeoRow = {
  instructor_id: string;
  lesson_date: string;   // yyyy-MM-dd
  start_time: string;    // HH:mm[:ss]
  duration_minutes: number;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
};

export interface InstructorLite {
  id: string;
  available_from?: string | null;
  buffer_minutes?: number | null;
  is_network_placeholder?: boolean | null;
}

export interface CourseAvailabilitySources {
  workingHours: WeeklyHourRow[];
  availabilityWindows: WeeklyHourRow[];
  overrides: DateOverrideRow[];
  calendarEvents: CalendarEventRow[];
  manualBlocks: ManualBlockRow[];
  /** Booked-lesson coords for travel-time padding. May be empty. */
  bookedLessonGeo: BookedLessonGeoRow[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MIN_FREE_MINUTES = 60;

// Network-placeholder instructors (no real calendar) use fixed assumed hours.
const NP_WEEKDAY_START = 8 * 60;
const NP_WEEKDAY_END   = 19 * 60;
const NP_WEEKEND_START = 9 * 60;
const NP_WEEKEND_END   = 12 * 60;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface Window { start: number; end: number }

function mergeWindows(wins: Window[]): Window[] {
  return mergeIntervals(wins);
}

/**
 * Weekly windows for one instructor on a given JS day-of-week (0=Sun..6=Sat).
 *
 * STRICT: rows missing or with unparseable `start_time` / `end_time` are
 * skipped entirely — no default substitution.
 */
function getWeeklyWindows(
  instructorId: string,
  jsDow: number,
  src: CourseAvailabilitySources,
): Window[] {
  const out: Window[] = [];

  // instructor_working_hours: 0=Sun..6=Sat
  for (const w of src.workingHours) {
    if (w.instructor_id !== instructorId || !w.is_active || w.day_of_week !== jsDow) continue;
    const s = parseHHMM(w.start_time);
    const e = parseHHMM(w.end_time);
    if (s == null || e == null) continue; // no data → not available
    if (e > s) out.push({ start: s, end: e });
  }

  // availability_windows: 1=Mon..7=Sun → map Sun (0) → 7
  const winDow = jsDow === 0 ? 7 : jsDow;
  for (const w of src.availabilityWindows) {
    if (w.instructor_id !== instructorId || !w.is_active) continue;
    // Tolerate rows stored under either convention.
    if (w.day_of_week !== winDow && w.day_of_week !== jsDow) continue;
    const s = parseHHMM(w.start_time);
    const e = parseHHMM(w.end_time);
    if (s == null || e == null) continue;
    if (e > s) out.push({ start: s, end: e });
  }

  return mergeWindows(out);
}

function getOverride(
  instructorId: string,
  dateStr: string,
  src: CourseAvailabilitySources,
): DateOverrideRow | null {
  for (const o of src.overrides) {
    if (o.instructor_id !== instructorId) continue;
    const inRange =
      o.override_date === dateStr ||
      (!!o.override_end_date && dateStr >= o.override_date && dateStr <= o.override_end_date);
    if (inRange) return o;
  }
  return null;
}

/**
 * Resolve the working windows for one instructor on one day, honouring overrides.
 *
 * STRICT override behaviour:
 *   - `is_available=false` → []
 *   - `is_available=true` AND both times present AND parseable → use them
 *   - `is_available=true` AND times missing or unparseable → [] (no fallback)
 *   - no override → weekly windows for that day-of-week (possibly [])
 */
function resolveWindowsForDay(
  instructor: InstructorLite,
  day: Date,
  src: CourseAvailabilitySources,
): Window[] {
  const dateStr = londonDateStr(day);
  const jsDow   = londonDow(day);
  const override = getOverride(instructor.id, dateStr, src);

  if (override) {
    if (!override.is_available) return [];
    const s = parseHHMM(override.start_time);
    const e = parseHHMM(override.end_time);
    if (s == null || e == null) return []; // marked available but no times → not available
    return e > s ? [{ start: s, end: e }] : [];
  }

  return getWeeklyWindows(instructor.id, jsDow, src);
}

// ---------------------------------------------------------------------------
// Network-placeholder fast path
// ---------------------------------------------------------------------------

export function hasNetworkPlaceholderAvailabilityOn(
  day: Date,
  minFreeMinutes = MIN_FREE_MINUTES,
): boolean {
  const todayStr = londonTodayStr();
  const dateStr  = londonDateStr(day);
  if (dateStr < todayStr) return false;
  const jsDow     = londonDow(day);
  const isWeekend = jsDow === 0 || jsDow === 6;
  const start = isWeekend ? NP_WEEKEND_START : NP_WEEKDAY_START;
  const end   = isWeekend ? NP_WEEKEND_END   : NP_WEEKDAY_END;
  const isToday = todayStr === dateStr;
  let nowMin = 0;
  if (isToday) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).formatToParts(new Date());
    const h = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
    const m = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
    nowMin = (h === 24 ? 0 : h) * 60 + (Number.isFinite(m) ? m : 0);
  }
  return end - Math.max(start, nowMin) >= minFreeMinutes;
}

// ---------------------------------------------------------------------------
// Public API — single unified day-level computation
// ---------------------------------------------------------------------------

export interface DayComputeOptions {
  durationMinutes: number;
  bufferMinutes: number;
  /** Keep public booking/course searches gated by instructor.available_from.
   *  Instructor diary surfaces can set false to ask the same engine for real
   *  working-hour gaps before the public booking start date. */
  respectAvailableFrom?: boolean;
  /** When > bufferMinutes, the first slot of the day is pushed by this many
   *  minutes (instructor travel-from-home buffer). Skipped if any real
   *  conflict already exists earlier in the working window. */
  firstLessonBufferMinutes?: number;
  /** STEP_MINUTES override — typically `instructor.slot_increment_minutes`. */
  slotIncrementMinutes?: number;
  timeOfDay?: TimeOfDay;
  minNoticeMinutes?: number;
  /** Coordinates of the candidate booking's pickup location. When provided
   *  alongside `bookedLessonGeo`, the engine injects synthetic "travel"
   *  conflicts around every existing booked lesson so a candidate slot cannot
   *  start at a location the instructor can't realistically drive to in time. */
  candidatePickup?: { lat: number; lng: number };
}

export interface DayComputeResult {
  /** Raw working windows for the day (e.g. split shifts). */
  windows: { start: number; end: number }[];
  /** All bookable slot start/end in minutes-since-midnight. */
  slots: Slot[];
  /** Rejected candidates with reason — for tooltips. */
  rejected: RejectedSlot[];
}

/**
 * THE unified day-level slot computation. Every booking surface (public
 * booking page, course discovery, auto-scheduler, instructor gap-fill,
 * create-booking guard) calls this so they cannot disagree.
 *
 * This function ONLY shapes data and forwards it to `resolveAvailability`.
 * It does not make availability decisions.
 */
export function computeDaySlots(
  instructor: InstructorLite,
  day: Date,
  src: CourseAvailabilitySources,
  opts: DayComputeOptions,
): DayComputeResult {
  const dateStr  = londonDateStr(day);
  const todayStr = londonTodayStr();
  const isToday  = todayStr === dateStr;

  // Hard gates: past day, available_from
  if (dateStr < todayStr) {
    return { windows: [], slots: [], rejected: [] };
  }
  if (
    opts.respectAvailableFrom !== false &&
    instructor.available_from &&
    instructor.available_from > dateStr
  ) {
    return { windows: [], slots: [], rejected: [] };
  }

  const windows = resolveWindowsForDay(instructor, day, src);
  if (windows.length === 0) {
    return { windows: [], slots: [], rejected: [] };
  }

  // Build the shared per-day conflict list ONCE. Never mutated below.
  const baseConflicts: TaggedConflict[] = buildDayConflicts(
    dateStr,
    src.manualBlocks
      .filter((b) => b.instructor_id === instructor.id)
      .map((b) => ({ start_datetime: b.start_datetime, end_datetime: b.end_datetime })),
    src.calendarEvents
      .filter((e) => e.instructor_id === instructor.id)
      .map((e) => ({ start_time: e.start_time, end_time: e.end_time, is_busy: e.is_busy })),
  );

  // Travel-time padding around existing booked lessons.
  // Only adds conflicts when BOTH the booked lesson's pickup coords AND the
  // candidate's pickup coords are known — otherwise we have no basis to
  // estimate drive time and silently fall back to the standard buffer.
  if (opts.candidatePickup && src.bookedLessonGeo?.length) {
    const cand = opts.candidatePickup;
    const dayLessons = src.bookedLessonGeo.filter(
      (l) => l.instructor_id === instructor.id && l.lesson_date === dateStr,
    );
    for (const l of dayLessons) {
      if (l.pickup_lat == null || l.pickup_lng == null) continue;
      const startMin = parseHHMM(l.start_time);
      if (startMin == null) continue; // strict: no midnight fallback
      const endMin = startMin + (l.duration_minutes ?? 0);
      const pickup = { lat: Number(l.pickup_lat), lng: Number(l.pickup_lng) };
      const dropoff =
        l.dropoff_lat != null && l.dropoff_lng != null
          ? { lat: Number(l.dropoff_lat), lng: Number(l.dropoff_lng) }
          : pickup;

      const travelIn = estimateDriveMinutes(cand, pickup);   // cand dropoff → lesson pickup
      const travelOut = estimateDriveMinutes(dropoff, cand); // lesson dropoff → cand pickup
      if (travelIn > 0) {
        baseConflicts.push({
          start: Math.max(0, startMin - travelIn),
          end: startMin,
          kind: "event",
          label: "Travel from previous lesson",
          padOverrideMin: 0,
        });
      }
      if (travelOut > 0) {
        baseConflicts.push({
          start: endMin,
          end: endMin + travelOut,
          kind: "event",
          label: "Travel to next lesson",
          padOverrideMin: 0,
        });
      }
    }
  }

  const buffer = Math.max(0, instructor.buffer_minutes ?? 0);
  const firstLessonBuffer = Math.max(0, opts.firstLessonBufferMinutes ?? 0);

  const allSlots: Slot[] = [];
  const allRejected: RejectedSlot[] = [];

  for (const win of windows) {
    let dayStartMin = win.start;

    // Per-window copy — synthetic "Travel from home" markers must NEVER leak
    // into the next window of a split shift.
    const winConflicts: TaggedConflict[] = [...baseConflicts];

    // First-lesson travel buffer applies whenever the instructor has been
    // idle long enough to be home — not only at the very start of the working
    // window. We inject synthetic "travel from home" blocks at the start of
    // every conflict-free gap whose length is ≥ firstLessonBuffer.
    if (firstLessonBuffer > buffer) {
      // Clip window-relevant conflicts and MERGE so adjacent/overlapping
      // ones don't corrupt the gap-pairing math below.
      const clipped = winConflicts
        .filter((c) => c.end > win.start && c.start < win.end)
        .map((c) => ({
          start: Math.max(c.start, win.start),
          end: Math.min(c.end, win.end),
        }));
      const merged = mergeIntervals(clipped);

      // Build the sequence of (gapStart, gapEnd) pairs: window start → first
      // conflict, then between consecutive conflicts, then last conflict →
      // window end.
      const gapStarts: number[] = [win.start, ...merged.map((c) => c.end)];
      const gapEnds: number[] = [
        ...merged.map((c) => c.start),
        win.end,
      ];

      for (let i = 0; i < gapStarts.length; i++) {
        const gStart = gapStarts[i];
        const gEnd = gapEnds[i];
        if (gEnd - gStart < firstLessonBuffer) continue;

        if (i === 0) {
          // Very first gap of the day: shift the window start directly.
          dayStartMin = Math.max(dayStartMin, gStart + firstLessonBuffer);
        } else {
          // Interior gap after a conflict: inject a synthetic "travel from
          // home" block at the gap start, INTO THE PER-WINDOW LIST ONLY.
          winConflicts.push({
            start: gStart,
            end: gStart + firstLessonBuffer,
            kind: "event",
            label: "Travel from home",
            padOverrideMin: 0,
          });
        }
      }
    }

    const result = resolveAvailability({
      dateStr,
      dayStartMin,
      dayEndMin: win.end,
      bufferMinutes: opts.bufferMinutes,
      durationMinutes: opts.durationMinutes,
      conflicts: winConflicts,
      timeOfDay: opts.timeOfDay,
      isToday,
      anchorSkipMinutes: opts.slotIncrementMinutes,
      minNoticeMinutes: opts.minNoticeMinutes,
    });
    allSlots.push(...result.slots);
    allRejected.push(...result.rejected);
  }

  // Note: `buffer` is intentionally unused below — it's read from the
  // instructor row by callers that pass `opts.bufferMinutes`. Kept for
  // readability of the firstLessonBuffer comparison above.
  void buffer;

  return { windows, slots: allSlots, rejected: allRejected };
}

/**
 * Coarse day-level "is this instructor bookable at all on this day?" used by
 * /courses discovery. Backed by the unified engine path so it cannot disagree
 * with the booking page.
 */
export function hasInstructorAvailabilityOn(
  instructor: InstructorLite,
  day: Date,
  src: CourseAvailabilitySources,
  opts: { minFreeMinutes?: number; applyBuffers?: boolean; candidatePickup?: { lat: number; lng: number } } = {},
): boolean {
  if (instructor.is_network_placeholder) {
    return hasNetworkPlaceholderAvailabilityOn(day, opts.minFreeMinutes ?? MIN_FREE_MINUTES);
  }

  const minFree = opts.minFreeMinutes ?? MIN_FREE_MINUTES;
  const applyBuffers = opts.applyBuffers !== false;

  // Use a slot duration of `minFree` so the engine's "fits inside window minus
  // conflicts" check directly answers our question. Increment by STEP_MINUTES
  // (engine default) — we only need ONE valid slot to return true.
  const result = computeDaySlots(instructor, day, src, {
    durationMinutes: minFree,
    bufferMinutes: applyBuffers ? Math.max(0, instructor.buffer_minutes ?? 0) : 0,
    candidatePickup: opts.candidatePickup,
  });
  return result.slots.length > 0;
}

// ---------------------------------------------------------------------------
// Data loader  (shared by browser and the create-booking edge function)
// ---------------------------------------------------------------------------

// Narrow typing for the public RPCs used below. The generated `Database`
// type doesn't list these as RPC return shapes, so we type the call surface
// locally rather than reaching for `any`.
type RpcCaller = <T>(name: string, args: Record<string, unknown>) =>
  Promise<{ data: T[] | null; error: unknown }>;
type RawCalendarRow = {
  instructor_id: string;
  start_time: string;
  end_time: string;
  is_busy?: boolean | null;
};

export async function loadCourseAvailabilitySources(
  client: SupabaseClient,
  instructorIds: string[],
  fromDate: Date,
  toDate: Date,
): Promise<CourseAvailabilitySources> {
  if (instructorIds.length === 0) {
    return { workingHours: [], availabilityWindows: [], overrides: [], calendarEvents: [], manualBlocks: [], bookedLessonGeo: [] };
  }

  const fromStr = format(fromDate, "yyyy-MM-dd");
  const toStr   = format(toDate,   "yyyy-MM-dd");
  const fromIso = startOfDay(fromDate).toISOString();
  const toIso   = startOfDay(addDays(toDate, 1)).toISOString();

  // Cast the rpc method once locally instead of `any`-casting every call.
  const rpc = client.rpc.bind(client) as unknown as RpcCaller;

  const [whRes, awRes, ovRes, mbRes, ceRes, lgRes] = await Promise.all([
    client
      .from("instructor_working_hours")
      .select("instructor_id, day_of_week, is_active, start_time, end_time")
      .in("instructor_id", instructorIds),
    client
      .from("availability_windows")
      .select("instructor_id, day_of_week, is_active, start_time, end_time")
      .in("instructor_id", instructorIds),
    client
      .from("instructor_date_overrides")
      .select("instructor_id, override_date, override_end_date, is_available, start_time, end_time")
      .in("instructor_id", instructorIds)
      .or(`override_date.gte.${fromStr},override_end_date.gte.${fromStr}`)
      .lte("override_date", toStr),
    // Public-safe RPC — returns only instructor_id, start/end datetime, no titles.
    rpc<ManualBlockRow>("get_public_instructor_manual_blocks", {
      p_instructor_ids: instructorIds,
      p_from_datetime: fromIso,
      p_to_datetime: toIso,
    }),
    // Public-safe RPC — returns only instructor_id, start_time, end_time, is_busy.
    rpc<RawCalendarRow>("get_public_instructor_calendar_blocks", {
      p_instructor_ids: instructorIds,
      p_from_datetime: fromIso,
      p_to_datetime: toIso,
    }),
    // Public-safe RPC — returns ONLY coords + timing of booked lessons.
    rpc<BookedLessonGeoRow>("get_public_instructor_lesson_geo", {
      p_instructor_ids: instructorIds,
      p_from_date: fromStr,
      p_to_date: toStr,
    }),
  ]);

  // Normalise `is_busy` at the data boundary: `null`/`undefined` → `true`
  // (fail closed). Every downstream consumer now sees identical data.
  const calendarEvents: CalendarEventRow[] = (ceRes.data ?? []).map((e) => ({
    instructor_id: e.instructor_id,
    start_time: e.start_time,
    end_time: e.end_time,
    is_busy: e.is_busy ?? true,
  }));

  const bookedLessonGeo = (lgRes.data as BookedLessonGeoRow[] | null) ?? [];

  // NOTE: scheduled_lessons rows are deliberately NOT injected as synthetic
  // busy events. Google Calendar mirror + manual blocks are the sole source of
  // busyness. `bookedLessonGeo` is kept ONLY so the engine can pad candidate
  // slots with realistic travel time around lessons that are also present in
  // the live Google mirror.

  type WHResult = { data: WeeklyHourRow[] | null };
  type OVResult = { data: DateOverrideRow[] | null };
  type MBResult = { data: ManualBlockRow[] | null };

  return {
    workingHours:        ((whRes as unknown as WHResult).data) ?? [],
    availabilityWindows: ((awRes as unknown as WHResult).data) ?? [],
    overrides:           ((ovRes as unknown as OVResult).data) ?? [],
    manualBlocks:        ((mbRes as unknown as MBResult).data) ?? [],
    calendarEvents,
    bookedLessonGeo,
  };
}
