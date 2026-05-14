// Shared availability resolver for learner-facing course display.
// An instructor is considered "available on date X" when:
//   1. The date is on/after their available_from.
//   2. A date override exists with is_available=true, OR there is a weekly
//      working window for that day-of-week (from instructor_working_hours
//      OR availability_windows).
//   3. After subtracting timed conflicts (existing scheduled lessons,
//      manual blocks, and Google Calendar busy events) the remaining free
//      time within the working window is at least MIN_FREE_MINUTES.
//
// All-day / multi-day calendar events (e.g. "Summer term", "School holiday")
// are treated as informational context and do NOT block the day on their own,
// matching the existing slot-search behavior.

import { format, isAfter, parseISO, startOfDay, isBefore, addDays } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";

// Default travel-time padding around any conflict, mirroring availabilityCore.
// Always added on top of the instructor's configured buffer.
export const TRAVEL_FALLBACK_MIN = 10;

export type WeeklyHourRow = {
  instructor_id: string;
  day_of_week: number;
  is_active: boolean;
  start_time?: string | null;
  end_time?: string | null;
};

export type DateOverrideRow = {
  instructor_id: string;
  override_date: string;
  override_end_date?: string | null;
  is_available: boolean;
  start_time?: string | null;
  end_time?: string | null;
};

export type CalendarEventRow = {
  instructor_id: string;
  start_time: string; // ISO
  end_time: string;   // ISO
  is_busy?: boolean | null;
};

export type ScheduledLessonRow = {
  instructor_id: string;
  lesson_date: string;     // yyyy-MM-dd
  start_time: string;      // HH:mm[:ss]
  duration_minutes: number;
};

export type ManualBlockRow = {
  instructor_id: string;
  start_datetime: string;
  end_datetime: string;
};

export interface InstructorLite {
  id: string;
  available_from?: string | null;
  /** Per-instructor configured buffer between lessons in minutes. */
  buffer_minutes?: number | null;
}

export interface CourseAvailabilitySources {
  workingHours: WeeklyHourRow[];        // 0=Sun..6=Sat (instructor_working_hours)
  availabilityWindows: WeeklyHourRow[]; // 1=Mon..7=Sun (availability_windows)
  overrides: DateOverrideRow[];
  calendarEvents: CalendarEventRow[];
  scheduledLessons: ScheduledLessonRow[];
  manualBlocks: ManualBlockRow[];
}

const DEFAULT_DAY_START = "08:00";
const DEFAULT_DAY_END = "20:00";
export const MIN_FREE_MINUTES = 60;

function timeToMin(t?: string | null): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map((s) => parseInt(s, 10));
  if (Number.isNaN(h)) return null;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

interface Window { start: number; end: number }

/** Collect every weekly working window for an instructor on this JS day-of-week. */
function getWeeklyWindows(
  instructorId: string,
  jsDow: number, // 0=Sun..6=Sat
  src: CourseAvailabilitySources,
): Window[] {
  const out: Window[] = [];

  // instructor_working_hours stores 0=Sun..6=Sat.
  for (const w of src.workingHours) {
    if (w.instructor_id !== instructorId) continue;
    if (!w.is_active) continue;
    if (w.day_of_week !== jsDow) continue;
    const s = timeToMin(w.start_time) ?? timeToMin(DEFAULT_DAY_START)!;
    const e = timeToMin(w.end_time) ?? timeToMin(DEFAULT_DAY_END)!;
    if (e > s) out.push({ start: s, end: e });
  }

  // availability_windows stores 1=Mon..7=Sun. Map: jsDow 0 (Sun) -> 7, else jsDow.
  const winDow = jsDow === 0 ? 7 : jsDow;
  for (const w of src.availabilityWindows) {
    if (w.instructor_id !== instructorId) continue;
    if (!w.is_active) continue;
    // Be tolerant: also match if the row was incorrectly stored using the
    // other convention (so a 0=Sun row in availability_windows still works).
    if (w.day_of_week !== winDow && w.day_of_week !== jsDow) continue;
    const s = timeToMin(w.start_time) ?? timeToMin(DEFAULT_DAY_START)!;
    const e = timeToMin(w.end_time) ?? timeToMin(DEFAULT_DAY_END)!;
    if (e > s) out.push({ start: s, end: e });
  }

  // Merge overlapping windows so conflict subtraction is well-defined.
  out.sort((a, b) => a.start - b.start);
  const merged: Window[] = [];
  for (const w of out) {
    const last = merged[merged.length - 1];
    if (last && w.start <= last.end) last.end = Math.max(last.end, w.end);
    else merged.push({ ...w });
  }
  return merged;
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

function clipEventToDay(
  startIso: string,
  endIso: string,
  dateStr: string,
): Window | null {
  const sd = new Date(startIso);
  const ed = new Date(endIso);
  if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return null;
  const sStr = format(sd, "yyyy-MM-dd");
  const eStr = format(ed, "yyyy-MM-dd");
  if (sStr > dateStr || eStr < dateStr) return null;
  const startMin = sStr === dateStr ? sd.getHours() * 60 + sd.getMinutes() : 0;
  const endMin = eStr === dateStr ? ed.getHours() * 60 + ed.getMinutes() : 24 * 60;
  if (endMin <= startMin) return null;
  return { start: startMin, end: endMin };
}

function isAllDayLikeEvent(ev: CalendarEventRow): boolean {
  try {
    const s = new Date(ev.start_time);
    const e = new Date(ev.end_time);
    const durMs = e.getTime() - s.getTime();
    if (durMs >= 23 * 60 * 60 * 1000) return true;
    const startsAtMidnight = s.getHours() === 0 && s.getMinutes() === 0;
    if (startsAtMidnight && durMs >= 12 * 60 * 60 * 1000) return true;
    return false;
  } catch {
    return true;
  }
}

function getDayConflicts(
  instructorId: string,
  dateStr: string,
  src: CourseAvailabilitySources,
): Window[] {
  const conflicts: Window[] = [];

  for (const l of src.scheduledLessons) {
    if (l.instructor_id !== instructorId) continue;
    if (l.lesson_date !== dateStr) continue;
    const s = timeToMin((l.start_time || "").slice(0, 5));
    if (s == null) continue;
    conflicts.push({ start: s, end: s + (l.duration_minutes || 60) });
  }

  for (const b of src.manualBlocks) {
    if (b.instructor_id !== instructorId) continue;
    const c = clipEventToDay(b.start_datetime, b.end_datetime, dateStr);
    if (c) conflicts.push(c);
  }

  for (const ev of src.calendarEvents) {
    if (ev.instructor_id !== instructorId) continue;
    if (ev.is_busy === false) continue;
    if (isAllDayLikeEvent(ev)) continue; // ignore informational all-day events
    const c = clipEventToDay(ev.start_time, ev.end_time, dateStr);
    if (c) conflicts.push(c);
  }

  return conflicts;
}

/** Subtract conflicts from windows and return remaining free time spans. */
function subtractConflicts(windows: Window[], conflicts: Window[]): Window[] {
  if (windows.length === 0) return [];
  if (conflicts.length === 0) return windows.map((w) => ({ ...w }));

  // Merge conflicts.
  const sorted = [...conflicts].sort((a, b) => a.start - b.start);
  const merged: Window[] = [];
  for (const c of sorted) {
    const last = merged[merged.length - 1];
    if (last && c.start <= last.end) last.end = Math.max(last.end, c.end);
    else merged.push({ ...c });
  }

  const free: Window[] = [];
  for (const w of windows) {
    let cur = w.start;
    for (const c of merged) {
      if (c.end <= cur) continue;
      if (c.start >= w.end) break;
      if (c.start > cur) free.push({ start: cur, end: Math.min(c.start, w.end) });
      cur = Math.max(cur, c.end);
      if (cur >= w.end) break;
    }
    if (cur < w.end) free.push({ start: cur, end: w.end });
  }
  return free.filter((s) => s.end - s.start > 0);
}

export function hasInstructorAvailabilityOn(
  instructor: InstructorLite,
  day: Date,
  src: CourseAvailabilitySources,
  opts: { minFreeMinutes?: number } = {},
): boolean {
  const today = startOfDay(new Date());
  if (isBefore(day, today)) return false;
  if (instructor.available_from && isAfter(parseISO(instructor.available_from), day)) {
    return false;
  }

  const dateStr = format(day, "yyyy-MM-dd");
  const jsDow = day.getDay();
  const override = getOverride(instructor.id, dateStr, src);

  // Explicit unavailable override always wins.
  if (override && override.is_available === false) return false;

  let windows: Window[] = [];

  if (override && override.is_available && (override.start_time || override.end_time)) {
    const s = timeToMin(override.start_time) ?? timeToMin(DEFAULT_DAY_START)!;
    const e = timeToMin(override.end_time) ?? timeToMin(DEFAULT_DAY_END)!;
    if (e > s) windows = [{ start: s, end: e }];
  } else if (override && override.is_available) {
    // Override flagged available with no times — fall back to default working window.
    const weekly = getWeeklyWindows(instructor.id, jsDow, src);
    windows = weekly.length > 0 ? weekly : [{
      start: timeToMin(DEFAULT_DAY_START)!,
      end: timeToMin(DEFAULT_DAY_END)!,
    }];
  } else {
    windows = getWeeklyWindows(instructor.id, jsDow, src);
  }

  if (windows.length === 0) return false;

  const conflicts = getDayConflicts(instructor.id, dateStr, src);
  const free = subtractConflicts(windows, conflicts);

  // If today, drop spans that have already passed.
  const isToday = format(today, "yyyy-MM-dd") === dateStr;
  const minFree = opts.minFreeMinutes ?? MIN_FREE_MINUTES;
  const nowMin = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;

  for (const span of free) {
    const effectiveStart = isToday ? Math.max(span.start, nowMin) : span.start;
    if (span.end - effectiveStart >= minFree) return true;
  }
  return false;
}
