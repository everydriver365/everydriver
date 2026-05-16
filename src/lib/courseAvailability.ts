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
import { isAllDayLikeEvent as engineIsAllDayLikeEvent, TRAVEL_FALLBACK_MIN as ENGINE_TRAVEL_FALLBACK_MIN } from "./availabilityEngine";

// Default travel-time padding around any conflict.
// Re-exported from the unified engine so the value lives in exactly one place.
export const TRAVEL_FALLBACK_MIN = ENGINE_TRAVEL_FALLBACK_MIN;

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
  is_network_placeholder?: boolean | null;
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

const NETWORK_PLACEHOLDER_WEEKDAY_START_MIN = 8 * 60;
const NETWORK_PLACEHOLDER_WEEKDAY_END_MIN = 19 * 60;
const NETWORK_PLACEHOLDER_WEEKEND_START_MIN = 9 * 60;
const NETWORK_PLACEHOLDER_WEEKEND_END_MIN = 12 * 60;

export function hasNetworkPlaceholderAvailabilityOn(
  day: Date,
  minFreeMinutes: number = MIN_FREE_MINUTES,
): boolean {
  const today = startOfDay(new Date());
  if (isBefore(day, today)) return false;

  const jsDow = day.getDay();
  const isWeekend = jsDow === 0 || jsDow === 6;
  const start = isWeekend ? NETWORK_PLACEHOLDER_WEEKEND_START_MIN : NETWORK_PLACEHOLDER_WEEKDAY_START_MIN;
  const end = isWeekend ? NETWORK_PLACEHOLDER_WEEKEND_END_MIN : NETWORK_PLACEHOLDER_WEEKDAY_END_MIN;

  const dateStr = format(day, "yyyy-MM-dd");
  const isToday = format(today, "yyyy-MM-dd") === dateStr;
  const nowMin = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;
  const effectiveStart = isToday ? Math.max(start, nowMin) : start;

  return end - effectiveStart >= minFreeMinutes;
}

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
  // Delegates to the unified engine — same rule everywhere.
  return engineIsAllDayLikeEvent(ev.start_time, ev.end_time);
}

/**
 * Build the conflict list for `dateStr`, expanded by `padMinutes` on each side.
 * Padding is applied per-conflict so that buffer + travel time around an
 * existing lesson, manual block, or Google Calendar event blocks the search
 * results AND the booking validator from offering an overlapping slot.
 */
function getDayConflicts(
  instructorId: string,
  dateStr: string,
  src: CourseAvailabilitySources,
  padMinutes = 0,
): Window[] {
  const conflicts: Window[] = [];
  const pad = Math.max(0, padMinutes);

  for (const l of src.scheduledLessons) {
    if (l.instructor_id !== instructorId) continue;
    if (l.lesson_date !== dateStr) continue;
    const s = timeToMin((l.start_time || "").slice(0, 5));
    if (s == null) continue;
    conflicts.push({ start: s - pad, end: s + (l.duration_minutes || 60) + pad });
  }

  for (const b of src.manualBlocks) {
    if (b.instructor_id !== instructorId) continue;
    const c = clipEventToDay(b.start_datetime, b.end_datetime, dateStr);
    if (c) conflicts.push({ start: c.start - pad, end: c.end + pad });
  }

  for (const ev of src.calendarEvents) {
    if (ev.instructor_id !== instructorId) continue;
    if (ev.is_busy === false) continue;
    if (isAllDayLikeEvent(ev)) continue; // ignore informational all-day events
    const c = clipEventToDay(ev.start_time, ev.end_time, dateStr);
    if (c) conflicts.push({ start: c.start - pad, end: c.end + pad });
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

/** Build the working windows for the instructor on `day`, honouring overrides. */
function resolveWindowsForDay(
  instructor: InstructorLite,
  day: Date,
  src: CourseAvailabilitySources,
): Window[] {
  const dateStr = format(day, "yyyy-MM-dd");
  const jsDow = day.getDay();
  const override = getOverride(instructor.id, dateStr, src);

  if (override && override.is_available === false) return [];

  if (override && override.is_available && (override.start_time || override.end_time)) {
    const s = timeToMin(override.start_time) ?? timeToMin(DEFAULT_DAY_START)!;
    const e = timeToMin(override.end_time) ?? timeToMin(DEFAULT_DAY_END)!;
    return e > s ? [{ start: s, end: e }] : [];
  }

  if (override && override.is_available) {
    const weekly = getWeeklyWindows(instructor.id, jsDow, src);
    return weekly.length > 0
      ? weekly
      : [{ start: timeToMin(DEFAULT_DAY_START)!, end: timeToMin(DEFAULT_DAY_END)! }];
  }

  return getWeeklyWindows(instructor.id, jsDow, src);
}

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
  if (instructor.available_from && isAfter(parseISO(instructor.available_from), day)) {
    return false;
  }

  const windows = resolveWindowsForDay(instructor, day, src);
  if (windows.length === 0) return false;

  // For day-level availability we apply buffer + travel padding by default so
  // that an instructor with a 9–5 day already booked 9–4 (with a 30 min buffer)
  // doesn't show as having a free hour at 4 pm if a learner couldn't actually
  // book it at the booking step.
  const applyBuffers = opts.applyBuffers !== false;
  const pad = applyBuffers
    ? Math.max(0, instructor.buffer_minutes ?? 0) + TRAVEL_FALLBACK_MIN
    : 0;

  const dateStr = format(day, "yyyy-MM-dd");
  const conflicts = getDayConflicts(instructor.id, dateStr, src, pad);
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

// ---------------------------------------------------------------------------
// Shared loader — used by useCourseDiscovery (browser) and the booking guard
// inside the create-booking edge function (Deno) so both consumers see exactly
// the same six tables in exactly the same shape. The edge function copies an
// equivalent helper rather than importing this directly because it runs Deno.
// ---------------------------------------------------------------------------
export async function loadCourseAvailabilitySources(
  client: SupabaseClient,
  instructorIds: string[],
  fromDate: Date,
  toDate: Date,
): Promise<CourseAvailabilitySources> {
  if (instructorIds.length === 0) {
    return {
      workingHours: [],
      availabilityWindows: [],
      overrides: [],
      calendarEvents: [],
      scheduledLessons: [],
      manualBlocks: [],
    };
  }

  const fromStr = format(fromDate, "yyyy-MM-dd");
  const toStr = format(toDate, "yyyy-MM-dd");
  const fromIso = startOfDay(fromDate).toISOString();
  const toIso = startOfDay(addDays(toDate, 1)).toISOString();

  const [
    workingHoursRes,
    availabilityWindowsRes,
    overridesRes,
    manualBlocksRes,
    scheduledLessonsRes,
    calendarEventsRes,
  ] = await Promise.all([
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
    // Public-safe RPC: returns only instructor_id + start/end datetime, no titles/notes.
    // Works for anonymous website visitors as well as logged-in users.
    client.rpc("get_public_instructor_manual_blocks", {
      p_instructor_ids: instructorIds,
      p_from_datetime: fromIso,
      p_to_datetime: toIso,
    }),
    // Public-safe RPC: returns only instructor_id, lesson_date, start_time,
    // duration_minutes for non-cancelled lessons. No pupil details.
    client.rpc("get_public_scheduled_lesson_blocks", {
      p_instructor_ids: instructorIds,
      p_from_date: fromStr,
      p_to_date: toStr,
    }),
    (client as any).rpc("get_public_instructor_calendar_blocks", {
      p_instructor_ids: instructorIds,
      p_from_datetime: fromIso,
      p_to_datetime: toIso,
    }),
  ]);

  return {
    workingHours: (workingHoursRes.data as WeeklyHourRow[]) ?? [],
    availabilityWindows: (availabilityWindowsRes.data as WeeklyHourRow[]) ?? [],
    overrides: (overridesRes.data as DateOverrideRow[]) ?? [],
    manualBlocks: (manualBlocksRes.data as ManualBlockRow[]) ?? [],
    scheduledLessons: (scheduledLessonsRes.data as ScheduledLessonRow[]) ?? [],
    calendarEvents: (calendarEventsRes.data as CalendarEventRow[]) ?? [],
  };
}

// ---------------------------------------------------------------------------
// Booking-time guard — runs the same conflict logic against an exact
// (date, startMin, durationMin) slot. Returns ok=true when the slot fits
// inside a working window with no overlap (after buffer/travel padding).
// ---------------------------------------------------------------------------
export type BookingRejectReason =
  | "past"
  | "outside_working_hours"
  | "lesson_clash"
  | "manual_block"
  | "gcal_conflict"
  | "buffer";

export interface BookingValidationResult {
  ok: boolean;
  reason?: BookingRejectReason;
  conflict?: { startMin: number; endMin: number; kind: BookingRejectReason };
}

export function validateBookingSlot(
  instructor: InstructorLite,
  day: Date,
  startMin: number,
  durationMin: number,
  src: CourseAvailabilitySources,
): BookingValidationResult {
  const today = startOfDay(new Date());
  const dateStr = format(day, "yyyy-MM-dd");

  if (isBefore(day, today)) return { ok: false, reason: "past" };
  if (instructor.available_from && isAfter(parseISO(instructor.available_from), day)) {
    return { ok: false, reason: "past" };
  }

  const endMin = startMin + durationMin;
  const windows = resolveWindowsForDay(instructor, day, src);
  const insideWindow = windows.some((w) => startMin >= w.start && endMin <= w.end);
  if (!insideWindow) return { ok: false, reason: "outside_working_hours" };

  const pad = Math.max(0, instructor.buffer_minutes ?? 0) + TRAVEL_FALLBACK_MIN;

  // Check each conflict source separately so the rejection reason is precise.
  const lessonConflicts = getDayConflicts(instructor.id, dateStr, {
    ...src,
    manualBlocks: [],
    calendarEvents: [],
  }, pad);
  for (const c of lessonConflicts) {
    if (c.start < endMin && c.end > startMin) {
      const isBuffer = c.start >= startMin - pad && c.end <= endMin + pad
        ? false
        : (c.start <= startMin - pad || c.end >= endMin + pad);
      return {
        ok: false,
        reason: isBuffer ? "buffer" : "lesson_clash",
        conflict: { startMin: c.start + pad, endMin: c.end - pad, kind: "lesson_clash" },
      };
    }
  }

  const blockConflicts = getDayConflicts(instructor.id, dateStr, {
    ...src,
    scheduledLessons: [],
    calendarEvents: [],
  }, pad);
  for (const c of blockConflicts) {
    if (c.start < endMin && c.end > startMin) {
      return {
        ok: false,
        reason: "manual_block",
        conflict: { startMin: c.start + pad, endMin: c.end - pad, kind: "manual_block" },
      };
    }
  }

  const gcalConflicts = getDayConflicts(instructor.id, dateStr, {
    ...src,
    scheduledLessons: [],
    manualBlocks: [],
  }, pad);
  for (const c of gcalConflicts) {
    if (c.start < endMin && c.end > startMin) {
      return {
        ok: false,
        reason: "gcal_conflict",
        conflict: { startMin: c.start + pad, endMin: c.end - pad, kind: "gcal_conflict" },
      };
    }
  }

  return { ok: true };
}
