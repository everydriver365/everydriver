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
  isAllDayLikeEvent,
  TRAVEL_FALLBACK_MIN,
} from "./availabilityEngine";

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

/** Clip an ISO interval to [dateStr] using LOCAL dates (browser context). */
function clipToDay(startIso: string, endIso: string, dateStr: string): Window | null {
  const sd = new Date(startIso);
  const ed = new Date(endIso);
  if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return null;
  const sStr = format(sd, "yyyy-MM-dd");
  const eStr = format(ed, "yyyy-MM-dd");
  if (sStr > dateStr || eStr < dateStr) return null;
  const startMin = sStr === dateStr ? sd.getHours() * 60 + sd.getMinutes() : 0;
  const endMin   = eStr === dateStr ? ed.getHours() * 60 + ed.getMinutes() : 24 * 60;
  if (endMin <= startMin) return null;
  return { start: startMin, end: endMin };
}

function getDayConflicts(
  instructorId: string,
  dateStr: string,
  src: CourseAvailabilitySources,
  padMinutes = 0,
): Window[] {
  const conflicts: Window[] = [];
  const pad = Math.max(0, padMinutes);

  for (const b of src.manualBlocks) {
    if (b.instructor_id !== instructorId) continue;
    const c = clipToDay(b.start_datetime, b.end_datetime, dateStr);
    if (c) conflicts.push({ start: c.start - pad, end: c.end + pad });
  }

  for (const ev of src.calendarEvents) {
    if (ev.instructor_id !== instructorId) continue;
    if (ev.is_busy === false) continue;
    if (isAllDayLikeEvent(ev.start_time, ev.end_time)) continue;
    const c = clipToDay(ev.start_time, ev.end_time, dateStr);
    if (c) conflicts.push({ start: c.start - pad, end: c.end + pad });
  }

  return conflicts;
}

function subtractConflicts(windows: Window[], conflicts: Window[]): Window[] {
  if (windows.length === 0 || conflicts.length === 0) return windows.map((w) => ({ ...w }));
  const merged = mergeWindows(conflicts);
  const free: Window[] = [];

  for (const w of windows) {
    let cur = w.start;
    for (const c of merged) {
      if (c.end <= cur || c.start >= w.end) { if (c.start >= w.end) break; continue; }
      if (c.start > cur) free.push({ start: cur, end: Math.min(c.start, w.end) });
      cur = Math.max(cur, c.end);
      if (cur >= w.end) break;
    }
    if (cur < w.end) free.push({ start: cur, end: w.end });
  }

  return free.filter((s) => s.end - s.start > 0);
}

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
// Public API
// ---------------------------------------------------------------------------

/**
 * True when the instructor has at least MIN_FREE_MINUTES of bookable time on
 * `day` after removing conflicts.
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

  const today = startOfDay(new Date());
  if (isBefore(day, today)) return false;
  if (instructor.available_from && isAfter(parseISO(instructor.available_from), day)) return false;

  const windows = resolveWindowsForDay(instructor, day, src);
  if (windows.length === 0) return false;

  const applyBuffers = opts.applyBuffers !== false;
  const pad = applyBuffers ? Math.max(0, instructor.buffer_minutes ?? 0) : 0;

  const dateStr  = format(day, "yyyy-MM-dd");
  const conflicts = getDayConflicts(instructor.id, dateStr, src, pad);
  const free      = subtractConflicts(windows, conflicts);

  const isToday  = format(today, "yyyy-MM-dd") === dateStr;
  const minFree  = opts.minFreeMinutes ?? MIN_FREE_MINUTES;
  const nowMin   = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;

  for (const span of free) {
    const effectiveStart = isToday ? Math.max(span.start, nowMin) : span.start;
    if (span.end - effectiveStart >= minFree) return true;
  }
  return false;
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
