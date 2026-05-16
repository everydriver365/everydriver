// =============================================================================
// courseAvailability.ts
// =============================================================================
//
// Learner-facing day-level availability resolver.
//
// "Is instructor X available on date D?" means:
//   1. D is today or in the future, and on/after instructor.available_from.
//   2. A working window exists for D (override or weekly hours).
//   3. After subtracting manual blocks and Google Calendar busy events the
//      remaining free time inside the window is ≥ MIN_FREE_MINUTES.
//
// Note: scheduled_lessons are NOT subtracted — every booking writes a Google
// Calendar event (rule 5 of the engine), so the calendar already reflects
// those lessons in instructor_calendar_events.
// =============================================================================

import { format, isAfter, isBefore, parseISO, startOfDay, addDays } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  TRAVEL_FALLBACK_MIN,
  resolveAvailability,
  buildDayConflicts,
  type TimeOfDay,
  type Slot,
  type RejectedSlot,
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
  is_busy?: boolean | null;
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

const DEFAULT_DAY_START = "08:00";
const DEFAULT_DAY_END   = "20:00";
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

function timeToMin(t?: string | null): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map((s) => parseInt(s, 10));
  if (Number.isNaN(h)) return null;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

function mergeWindows(wins: Window[]): Window[] {
  const sorted = [...wins].sort((a, b) => a.start - b.start);
  const merged: Window[] = [];
  for (const w of sorted) {
    const last = merged[merged.length - 1];
    if (last && w.start <= last.end) last.end = Math.max(last.end, w.end);
    else merged.push({ ...w });
  }
  return merged;
}

/** Weekly windows for one instructor on a given JS day-of-week (0=Sun..6=Sat). */
function getWeeklyWindows(
  instructorId: string,
  jsDow: number,
  src: CourseAvailabilitySources,
): Window[] {
  const out: Window[] = [];

  // instructor_working_hours: 0=Sun..6=Sat
  for (const w of src.workingHours) {
    if (w.instructor_id !== instructorId || !w.is_active || w.day_of_week !== jsDow) continue;
    const s = timeToMin(w.start_time) ?? timeToMin(DEFAULT_DAY_START)!;
    const e = timeToMin(w.end_time)   ?? timeToMin(DEFAULT_DAY_END)!;
    if (e > s) out.push({ start: s, end: e });
  }

  // availability_windows: 1=Mon..7=Sun → map Sun (0) → 7
  const winDow = jsDow === 0 ? 7 : jsDow;
  for (const w of src.availabilityWindows) {
    if (w.instructor_id !== instructorId || !w.is_active) continue;
    // Tolerate rows stored under either convention.
    if (w.day_of_week !== winDow && w.day_of_week !== jsDow) continue;
    const s = timeToMin(w.start_time) ?? timeToMin(DEFAULT_DAY_START)!;
    const e = timeToMin(w.end_time)   ?? timeToMin(DEFAULT_DAY_END)!;
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

// (Conflict clipping / subtraction now handled inside availabilityEngine via
//  buildDayConflicts + resolveAvailability — see computeDaySlots below.)


/** Resolve the working windows for one instructor on one day, honouring overrides. */
function resolveWindowsForDay(
  instructor: InstructorLite,
  day: Date,
  src: CourseAvailabilitySources,
): Window[] {
  const dateStr = format(day, "yyyy-MM-dd");
  const jsDow   = day.getDay();
  const override = getOverride(instructor.id, dateStr, src);

  if (override && !override.is_available) return [];

  if (override?.is_available && (override.start_time || override.end_time)) {
    const s = timeToMin(override.start_time) ?? timeToMin(DEFAULT_DAY_START)!;
    const e = timeToMin(override.end_time)   ?? timeToMin(DEFAULT_DAY_END)!;
    return e > s ? [{ start: s, end: e }] : [];
  }

  if (override?.is_available) {
    const weekly = getWeeklyWindows(instructor.id, jsDow, src);
    return weekly.length > 0
      ? weekly
      : [{ start: timeToMin(DEFAULT_DAY_START)!, end: timeToMin(DEFAULT_DAY_END)! }];
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
  const today = startOfDay(new Date());
  if (isBefore(day, today)) return false;
  const jsDow    = day.getDay();
  const isWeekend = jsDow === 0 || jsDow === 6;
  const start = isWeekend ? NP_WEEKEND_START : NP_WEEKDAY_START;
  const end   = isWeekend ? NP_WEEKEND_END   : NP_WEEKDAY_END;
  const dateStr   = format(day, "yyyy-MM-dd");
  const isToday   = format(today, "yyyy-MM-dd") === dateStr;
  const nowMin    = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;
  return end - Math.max(start, nowMin) >= minFreeMinutes;
}

// ---------------------------------------------------------------------------
// Public API — single unified day-level computation
// ---------------------------------------------------------------------------

export interface DayComputeOptions {
  durationMinutes: number;
  bufferMinutes: number;
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
 */
export function computeDaySlots(
  instructor: InstructorLite,
  day: Date,
  src: CourseAvailabilitySources,
  opts: DayComputeOptions,
): DayComputeResult {
  const dateStr = format(day, "yyyy-MM-dd");
  const today = startOfDay(new Date());
  const isToday = format(today, "yyyy-MM-dd") === dateStr;

  // Hard gates: past day, available_from
  if (isBefore(day, today)) {
    return { windows: [], slots: [], rejected: [] };
  }
  if (instructor.available_from && isAfter(parseISO(instructor.available_from), day)) {
    return { windows: [], slots: [], rejected: [] };
  }

  const windows = resolveWindowsForDay(instructor, day, src);
  if (windows.length === 0) {
    return { windows: [], slots: [], rejected: [] };
  }

  // Build conflicts once (engine handles the per-conflict padding internally).
  const conflicts = buildDayConflicts(
    dateStr,
    src.manualBlocks
      .filter((b) => b.instructor_id === instructor.id)
      .map((b) => ({ start_datetime: b.start_datetime, end_datetime: b.end_datetime })),
    src.calendarEvents
      .filter((e) => e.instructor_id === instructor.id)
      .map((e) => ({ start_time: e.start_time, end_time: e.end_time, is_busy: e.is_busy ?? true })),
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
      const startMin = parseHHMMtoMin(l.start_time);
      const endMin = startMin + (l.duration_minutes ?? 0);
      const pickup = { lat: Number(l.pickup_lat), lng: Number(l.pickup_lng) };
      const dropoff =
        l.dropoff_lat != null && l.dropoff_lng != null
          ? { lat: Number(l.dropoff_lat), lng: Number(l.dropoff_lng) }
          : pickup;

      const travelIn = estimateDriveMinutes(cand, pickup);   // cand dropoff → lesson pickup
      const travelOut = estimateDriveMinutes(dropoff, cand); // lesson dropoff → cand pickup
      if (travelIn > 0) {
        conflicts.push({
          start: Math.max(0, startMin - travelIn),
          end: startMin,
          kind: "event",
          label: "Travel from previous lesson",
          padOverrideMin: 0,
        });
      }
      if (travelOut > 0) {
        conflicts.push({
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
    // First-lesson travel buffer: shift the start of the window IF
    // (a) firstLessonBuffer is larger than the standard back-to-back buffer, AND
    // (b) no real conflict ends before the shifted start (i.e. this would still
    //     be the first lesson of the day).
    let dayStartMin = win.start;
    if (firstLessonBuffer > buffer) {
      const candidateStart = win.start + (firstLessonBuffer - buffer);
      const hasEarlierConflict = conflicts.some(
        (c) => c.start < candidateStart && c.end > win.start,
      );
      if (!hasEarlierConflict) dayStartMin = candidateStart;
    }

    const result = resolveAvailability({
      dateStr,
      dayStartMin,
      dayEndMin: win.end,
      bufferMinutes: opts.bufferMinutes,
      durationMinutes: opts.durationMinutes,
      conflicts,
      timeOfDay: opts.timeOfDay,
      isToday,
      anchorSkipMinutes: opts.slotIncrementMinutes,
      minNoticeMinutes: opts.minNoticeMinutes,
    });
    allSlots.push(...result.slots);
    allRejected.push(...result.rejected);
  }

  return { windows, slots: allSlots, rejected: allRejected };
}

function parseHHMMtoMin(t: string): number {
  const [h, m] = t.split(":").map((s) => parseInt(s, 10));
  return (h || 0) * 60 + (m || 0);
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
  opts: { minFreeMinutes?: number; applyBuffers?: boolean } = {},
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
  });
  return result.slots.length > 0;
}

// ---------------------------------------------------------------------------
// Data loader  (shared by browser and the create-booking edge function)
// ---------------------------------------------------------------------------

export async function loadCourseAvailabilitySources(
  client: SupabaseClient,
  instructorIds: string[],
  fromDate: Date,
  toDate: Date,
): Promise<CourseAvailabilitySources> {
  if (instructorIds.length === 0) {
    return { workingHours: [], availabilityWindows: [], overrides: [], calendarEvents: [], manualBlocks: [] };
  }

  const fromStr = format(fromDate, "yyyy-MM-dd");
  const toStr   = format(toDate,   "yyyy-MM-dd");
  const fromIso = startOfDay(fromDate).toISOString();
  const toIso   = startOfDay(addDays(toDate, 1)).toISOString();

  const [whRes, awRes, ovRes, mbRes, ceRes] = await Promise.all([
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
    client.rpc("get_public_instructor_manual_blocks", {
      p_instructor_ids: instructorIds,
      p_from_datetime: fromIso,
      p_to_datetime: toIso,
    }),
    // Public-safe RPC — returns only instructor_id, start_time, end_time, is_busy.
    (client as any).rpc("get_public_instructor_calendar_blocks", {
      p_instructor_ids: instructorIds,
      p_from_datetime: fromIso,
      p_to_datetime: toIso,
    }),
  ]);

  return {
    workingHours:       (whRes.data  as WeeklyHourRow[])     ?? [],
    availabilityWindows:(awRes.data  as WeeklyHourRow[])     ?? [],
    overrides:          (ovRes.data  as DateOverrideRow[])   ?? [],
    manualBlocks:       (mbRes.data  as ManualBlockRow[])    ?? [],
    calendarEvents:     (ceRes.data  as CalendarEventRow[])  ?? [],
  };
}
