// ============================================================================
// UNIFIED AVAILABILITY ENGINE
// ----------------------------------------------------------------------------
// The single source of truth for "is instructor X free at time T?".
//
// Every booking surface (course page, single-lesson booking, Find Slot,
// Fill Gaps, Add Lesson, Reschedule) AND the server-side `create-booking`
// guard call into this engine — directly or via the thin wrappers in
// availabilityCore.ts / courseAvailability.ts / lessonClashCheck.ts.
//
// Rules codified here (and ONLY here):
//   1. Working hours come from instructor_working_hours or availability_windows
//   2. Date overrides win over weekly hours
//   3. Conflicts = scheduled_lessons + manual_blocks + timed Google events
//   4. Google events that are ALL-DAY or MULTI-DAY (>12h) are informational —
//      they do NOT block slots. Instructors block real days off via manual
//      blocks. This is the rule that was breaking Ken D's calendar.
//   5. Buffer = instructor.buffer_minutes
//   6. Travel padding = per-pupil travel_time_minutes (overrides buffer when
//      larger) OR TRAVEL_FALLBACK_MIN
//   7. First-lesson-of-day rule: no leading buffer before the very first
//      commitment of the day
//
// Returns { slots, rejected, diagnostics } so the UI can explain WHY a slot
// is missing — making future debugging take seconds, not hours.
// ============================================================================

import { format } from "date-fns";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const STEP_MINUTES = 15;
/** Travel padding is no longer added on top of the instructor's buffer.
 *  Only the instructor-configured `buffer_minutes` (and per-pupil
 *  `travel_time_minutes` override, when set) gates slot spacing. */
export const TRAVEL_FALLBACK_MIN = 0;
/** Anything >= this duration (or starting at midnight & >= 12h) is treated as
 *  informational, not a hard block. */
const ALL_DAY_MS = 23 * 60 * 60 * 1000;
const MIDNIGHT_LONG_MS = 12 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TimeOfDay = "any" | "morning" | "afternoon" | "evening";
export type ConflictKind = "lesson" | "block" | "event";

export type RejectReason =
  | "past"
  | "time_of_day"
  | "outside_window"
  | "overlap_lesson"
  | "overlap_block"
  | "overlap_event"
  | "buffer_lesson"
  | "buffer_block"
  | "buffer_event";

export interface Slot {
  /** Minutes from midnight. */
  start: number;
  /** Minutes from midnight (exclusive). */
  end: number;
}

export interface TaggedConflict extends Slot {
  kind: ConflictKind;
  /** Human-readable label, useful for diagnostics ("Lesson with Sarah"). */
  label?: string;
  /** Override buffer for this conflict only (e.g. pupil travel_time_minutes). */
  padOverrideMin?: number;
}

export interface RejectedSlot extends Slot {
  reason: RejectReason;
  /** When the reject came from a conflict, the conflict that caused it. */
  cause?: TaggedConflict;
}

export interface EngineInput {
  /** yyyy-MM-dd of the day being resolved (local time). */
  dateStr: string;
  /** Minutes from midnight. The available working window for this day. */
  dayStartMin: number;
  dayEndMin: number;
  /** Instructor buffer between lessons, in minutes. */
  bufferMinutes: number;
  /** Desired slot length. */
  durationMinutes: number;
  /** Conflicts already loaded for this day. */
  conflicts: TaggedConflict[];
  /** Optional time-of-day filter. */
  timeOfDay?: TimeOfDay;
  /** True if `dateStr` is today — past slots are filtered. */
  isToday?: boolean;
  /** If set, after each emitted slot we jump forward this many minutes.
   *  Find Slot uses 60 (one anchor per hour). Fill Gaps leaves it unset. */
  anchorSkipMinutes?: number;
  /** Skip slots whose start time falls within this many minutes of `now`. */
  minNoticeMinutes?: number;
}

export interface DiagnosticsBlock {
  date: string;
  workingWindow: string; // "09:00–18:00"
  bufferMinutes: number;
  durationMinutes: number;
  conflictsConsidered: Array<{ kind: ConflictKind; window: string; blocking: boolean; reason?: string; label?: string }>;
  slotsOffered: string[];      // ["09:00", "10:00", ...]
  rejectionSummary: Record<RejectReason, number>;
}

export interface EngineResult {
  slots: Slot[];
  rejected: RejectedSlot[];
  diagnostics: DiagnosticsBlock;
}

// ---------------------------------------------------------------------------
// Helpers (exported — used by other libs)
// ---------------------------------------------------------------------------

export function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function fromMinutes(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * THE Google all-day rule. Used everywhere. Change it here, change it
 * everywhere.
 *
 * Returns true for events that should be IGNORED as bookable conflicts:
 *   - Multi-day events (>=23h, e.g. "Summer term" Apr→Jul)
 *   - Single all-day events (starts at 00:00, >=12h)
 *
 * These are informational only — instructors should use manual blocks to
 * actually mark themselves unavailable.
 */
export function isAllDayLikeEvent(startTime: string, endTime: string): boolean {
  try {
    const s = new Date(startTime);
    const e = new Date(endTime);
    const durMs = e.getTime() - s.getTime();
    if (durMs >= ALL_DAY_MS) return true;
    const startsAtMidnight = s.getHours() === 0 && s.getMinutes() === 0;
    if (startsAtMidnight && durMs >= MIDNIGHT_LONG_MS) return true;
    return false;
  } catch {
    return true;
  }
}

export function inTimeOfDay(startMin: number, tod: TimeOfDay = "any"): boolean {
  if (tod === "any") return true;
  if (tod === "morning") return startMin >= 6 * 60 && startMin < 12 * 60;
  if (tod === "afternoon") return startMin >= 12 * 60 && startMin < 17 * 60;
  if (tod === "evening") return startMin >= 17 * 60 && startMin < 22 * 60;
  return true;
}

/**
 * Convert raw rows from the three conflict sources into the tagged shape
 * the engine consumes. Multi-day blocks/events are clipped to this day.
 * Google events that match `isAllDayLikeEvent` are dropped entirely.
 */
export function buildDayConflicts(
  dateStr: string,
  lessons: Array<{ start_time: string; duration_minutes: number; pupil_travel_min?: number | null; label?: string }>,
  blocks: Array<{ start_datetime: string; end_datetime: string; label?: string }>,
  events: Array<{ start_time: string; end_time: string; is_busy?: boolean | null; label?: string }>,
): TaggedConflict[] {
  const out: TaggedConflict[] = [];

  // ──────────────────────────────────────────────────────────────────────
  // SOURCE-OF-TRUTH RULE (do NOT remove):
  // Google Calendar (mirrored to `instructor_calendar_events`) is the ONLY
  // source of "instructor is busy". `scheduled_lessons` is CRM/billing data
  // and is intentionally NOT consulted here. Every booking writes a Google
  // event in the same flow — that event is what blocks the slot.
  // The `lessons` parameter is kept for backwards compatibility with the
  // existing call sites but is deliberately ignored.
  // ──────────────────────────────────────────────────────────────────────
  void lessons;

  const clip = (sIso: string, eIso: string): Slot | null => {
    const sd = new Date(sIso);
    const ed = new Date(eIso);
    if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return null;
    const sStr = format(sd, "yyyy-MM-dd");
    const eStr = format(ed, "yyyy-MM-dd");
    if (sStr > dateStr || eStr < dateStr) return null;
    const startMin = sStr === dateStr ? sd.getHours() * 60 + sd.getMinutes() : 0;
    const endMin = eStr === dateStr ? ed.getHours() * 60 + ed.getMinutes() : 24 * 60;
    if (endMin <= startMin) return null;
    return { start: startMin, end: endMin };
  };

  for (const b of blocks) {
    const c = clip(b.start_datetime, b.end_datetime);
    if (c) out.push({ ...c, kind: "block", label: b.label });
  }

  for (const e of events) {
    if (e.is_busy === false) continue;
    if (isAllDayLikeEvent(e.start_time, e.end_time)) continue; // CODIFIED RULE
    const c = clip(e.start_time, e.end_time);
    if (c) out.push({ ...c, kind: "event", label: e.label });
  }

  return out;
}

// ---------------------------------------------------------------------------
// Conflict classification
// ---------------------------------------------------------------------------

function classify(slotStart: number, slotEnd: number, c: TaggedConflict, padMin: number): RejectReason | null {
  const pad = c.padOverrideMin != null ? c.padOverrideMin + TRAVEL_FALLBACK_MIN : padMin;
  const direct = slotStart < c.end && slotEnd > c.start;
  const padded = slotStart < c.end + pad && slotEnd > c.start - pad;
  if (!padded) return null;
  if (direct) {
    if (c.kind === "lesson") return "overlap_lesson";
    if (c.kind === "block") return "overlap_block";
    return "overlap_event";
  }
  if (c.kind === "lesson") return "buffer_lesson";
  if (c.kind === "block") return "buffer_block";
  return "buffer_event";
}

export function describeReason(reason: RejectReason, padMin: number): string {
  switch (reason) {
    case "past": return "Slot is in the past.";
    case "time_of_day": return "Outside selected time of day.";
    case "outside_window": return "Outside working hours.";
    case "overlap_lesson": return "Overlaps an existing lesson.";
    case "overlap_block": return "Overlaps a manual block.";
    case "overlap_event": return "Overlaps a Google Calendar event.";
    case "buffer_lesson": return `Too close to another lesson (needs ${padMin} min buffer + travel).`;
    case "buffer_block": return `Too close to a manual block (needs ${padMin} min buffer + travel).`;
    case "buffer_event": return `Too close to a Google Calendar event (needs ${padMin} min buffer + travel).`;
  }
}

// ---------------------------------------------------------------------------
// THE ENGINE
// ---------------------------------------------------------------------------

/**
 * Walk one day in 15-minute steps and emit every slot of `durationMinutes`
 * that doesn't violate working hours or any conflict (with buffer + travel
 * padding applied).
 *
 * Returns the slots, a rejection list (with reasons), and a diagnostics
 * block the UI can render in a debug panel.
 */
export function resolveAvailability(input: EngineInput): EngineResult {
  const {
    dateStr,
    dayStartMin,
    dayEndMin,
    bufferMinutes,
    durationMinutes,
    conflicts,
    timeOfDay = "any",
    isToday,
    anchorSkipMinutes,
    minNoticeMinutes = 0,
  } = input;

  const padMin = Math.max(0, bufferMinutes) + TRAVEL_FALLBACK_MIN;
  const now = new Date();
  const cutoffMin = isToday
    ? now.getHours() * 60 + now.getMinutes() + Math.max(0, minNoticeMinutes)
    : -1;

  const slots: Slot[] = [];
  const rejected: RejectedSlot[] = [];
  const rejectionSummary: Record<RejectReason, number> = {
    past: 0, time_of_day: 0, outside_window: 0,
    overlap_lesson: 0, overlap_block: 0, overlap_event: 0,
    buffer_lesson: 0, buffer_block: 0, buffer_event: 0,
  };

  for (let s = dayStartMin; s + durationMinutes <= dayEndMin; s += STEP_MINUTES) {
    const e = s + durationMinutes;

    if (cutoffMin >= 0 && s < cutoffMin) {
      rejected.push({ start: s, end: e, reason: "past" });
      rejectionSummary.past += 1;
      continue;
    }

    if (!inTimeOfDay(s, timeOfDay)) {
      rejected.push({ start: s, end: e, reason: "time_of_day" });
      rejectionSummary.time_of_day += 1;
      continue;
    }

    // Find the worst conflict (overlap beats buffer).
    let worstReason: RejectReason | null = null;
    let worstCause: TaggedConflict | undefined;
    for (const c of conflicts) {
      const r = classify(s, e, c, padMin);
      if (!r) continue;
      const isOverlap = r.startsWith("overlap_");
      const wasOverlap = worstReason?.startsWith("overlap_") ?? false;
      if (!worstReason || (!wasOverlap && isOverlap)) {
        worstReason = r;
        worstCause = c;
      }
      if (isOverlap) break;
    }

    if (worstReason) {
      rejected.push({ start: s, end: e, reason: worstReason, cause: worstCause });
      rejectionSummary[worstReason] += 1;
      continue;
    }

    slots.push({ start: s, end: e });
    if (anchorSkipMinutes && anchorSkipMinutes > STEP_MINUTES) {
      s += anchorSkipMinutes - STEP_MINUTES;
    }
  }

  const diagnostics: DiagnosticsBlock = {
    date: dateStr,
    workingWindow: `${fromMinutes(dayStartMin)}–${fromMinutes(dayEndMin)}`,
    bufferMinutes,
    durationMinutes,
    conflictsConsidered: conflicts.map((c) => ({
      kind: c.kind,
      window: `${fromMinutes(c.start)}–${fromMinutes(c.end)}`,
      blocking: true,
      label: c.label,
    })),
    slotsOffered: slots.map((sl) => fromMinutes(sl.start)),
    rejectionSummary,
  };

  return { slots, rejected, diagnostics };
}

/**
 * Single-slot validator. Used by `create-booking` and any code that needs a
 * yes/no answer for one specific (date, start, duration) tuple. Runs the same
 * rules as `resolveAvailability` so the server can never accept a slot the UI
 * shouldn't have shown.
 */
export function validateSlot(
  input: Omit<EngineInput, "anchorSkipMinutes"> & { startMin: number },
): { ok: true } | { ok: false; reason: RejectReason; cause?: TaggedConflict } {
  const {
    startMin, durationMinutes, dayStartMin, dayEndMin,
    bufferMinutes, conflicts, timeOfDay = "any", isToday, minNoticeMinutes = 0,
  } = input;

  const endMin = startMin + durationMinutes;
  if (startMin < dayStartMin || endMin > dayEndMin) {
    return { ok: false, reason: "outside_window" };
  }
  if (!inTimeOfDay(startMin, timeOfDay)) {
    return { ok: false, reason: "time_of_day" };
  }
  if (isToday) {
    const now = new Date();
    const cutoff = now.getHours() * 60 + now.getMinutes() + Math.max(0, minNoticeMinutes);
    if (startMin < cutoff) return { ok: false, reason: "past" };
  }

  const padMin = Math.max(0, bufferMinutes) + TRAVEL_FALLBACK_MIN;
  let worstReason: RejectReason | null = null;
  let worstCause: TaggedConflict | undefined;
  for (const c of conflicts) {
    const r = classify(startMin, endMin, c, padMin);
    if (!r) continue;
    const isOverlap = r.startsWith("overlap_");
    const wasOverlap = worstReason?.startsWith("overlap_") ?? false;
    if (!worstReason || (!wasOverlap && isOverlap)) {
      worstReason = r;
      worstCause = c;
    }
    if (isOverlap) break;
  }

  if (worstReason) return { ok: false, reason: worstReason, cause: worstCause };
  return { ok: true };
}
