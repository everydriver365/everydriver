// =============================================================================
// availabilityEngine.ts  —  THE canonical availability engine
// =============================================================================
//
// This file is the single source of truth for "is instructor X free at time T?"
//
// Rules (change here, change nowhere else):
//   1. Working hours come from instructor_working_hours (0=Sun..6=Sat) or
//      availability_windows (1=Mon..7=Sun). Both are honoured; overlaps merged.
//   2. Date overrides win over weekly hours.
//   3. Google Calendar events (mirrored to instructor_calendar_events) block
//      slots — UNLESS they are all-day or multi-day (≥23 h, or starts at
//      00:00 UTC and ≥12 h). Those are informational only.
//   4. instructor_manual_blocks are always honoured.
//   5. scheduled_lessons are NOT consulted — every booking writes a Google
//      event in the same transaction, so the calendar IS the lesson record.
//   6. Buffer = instructor.buffer_minutes. No hidden travel padding.
//      TRAVEL_FALLBACK_MIN = 0 everywhere — server and browser.
//
// The Deno edge-function copy (availabilityEngine.deno.ts) imports nothing from
// Node/browser globals. It must stay byte-for-byte logically identical to this
// file. If you change a rule here, change it there too.
// =============================================================================

export const STEP_MINUTES = 15;
export const TRAVEL_FALLBACK_MIN = 0; // No hidden padding. Buffer only.

// All-day detection thresholds (milliseconds).
const ALL_DAY_MS        = 23 * 60 * 60 * 1000; // ≥ 23 h  → multi-day
const MIDNIGHT_LONG_MS  = 12 * 60 * 60 * 1000; // starts at 00:00 UTC && ≥ 12 h

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TimeOfDay   = "any" | "morning" | "afternoon" | "evening";
export type ConflictKind = "block" | "event";

export type RejectReason =
  | "past"
  | "time_of_day"
  | "outside_window"
  | "overlap_block"
  | "overlap_event"
  | "buffer_block"
  | "buffer_event";

export interface Slot { start: number; end: number }

export interface TaggedConflict extends Slot {
  kind: ConflictKind;
  label?: string;
  /** Per-conflict buffer override (e.g. pupil travel_time_minutes). */
  padOverrideMin?: number;
}

export interface RejectedSlot extends Slot {
  reason: RejectReason;
  cause?: TaggedConflict;
}

export interface EngineInput {
  /** yyyy-MM-dd */
  dateStr: string;
  dayStartMin: number;
  dayEndMin: number;
  bufferMinutes: number;
  durationMinutes: number;
  conflicts: TaggedConflict[];
  timeOfDay?: TimeOfDay;
  isToday?: boolean;
  anchorSkipMinutes?: number;
  minNoticeMinutes?: number;
}

export interface EngineResult {
  slots: Slot[];
  rejected: RejectedSlot[];
}

// ---------------------------------------------------------------------------
// Pure helpers (exported — reused by wrappers)
// ---------------------------------------------------------------------------

export function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function fromMinutes(min: number): string {
  return `${Math.floor(min / 60).toString().padStart(2, "0")}:${(min % 60).toString().padStart(2, "0")}`;
}

/**
 * Returns true for events that should be IGNORED as booking conflicts:
 *   - Duration ≥ 23 h  (multi-day / term events)
 *   - Starts at 00:00 UTC and duration ≥ 12 h  (Google all-day sync format)
 *
 * IMPORTANT: always compare against UTC hours so server (Deno, UTC) and
 * browser (local tz) agree. Google sends all-day events as 00:00 UTC.
 */
export function isAllDayLikeEvent(startIso: string, endIso: string): boolean {
  try {
    const s = new Date(startIso);
    const e = new Date(endIso);
    const durMs = e.getTime() - s.getTime();
    if (durMs >= ALL_DAY_MS) return true;
    const startsAtMidnightUTC = s.getUTCHours() === 0 && s.getUTCMinutes() === 0;
    return startsAtMidnightUTC && durMs >= MIDNIGHT_LONG_MS;
  } catch {
    return true; // fail safe: ignore malformed events
  }
}

export function inTimeOfDay(startMin: number, tod: TimeOfDay = "any"): boolean {
  if (tod === "any")       return true;
  if (tod === "morning")   return startMin >= 6 * 60 && startMin < 12 * 60;
  if (tod === "afternoon") return startMin >= 12 * 60 && startMin < 17 * 60;
  if (tod === "evening")   return startMin >= 17 * 60 && startMin < 22 * 60;
  return true;
}

// ---------------------------------------------------------------------------
// Conflict builder
// ---------------------------------------------------------------------------

/**
 * Convert raw DB rows into the TaggedConflict shape the engine consumes.
 *
 * - scheduled_lessons are NOT passed in (rule 5 above — calendar is the record).
 * - All-day Google events are silently dropped.
 * - Multi-day blocks/events are clipped to this calendar day.
 *
 * Clipping uses UTC dates so server and browser agree on which day an event
 * falls on, regardless of the server's local timezone.
 */
export function buildDayConflicts(
  dateStr: string,
  blocks: Array<{ start_datetime: string; end_datetime: string; label?: string }>,
  events: Array<{ start_time: string; end_time: string; is_busy?: boolean | null; label?: string; padOverrideMin?: number }>,
): TaggedConflict[] {
  const out: TaggedConflict[] = [];

  const clipUTC = (sIso: string, eIso: string): Slot | null => {
    const sd = new Date(sIso);
    const ed = new Date(eIso);
    if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return null;
    // Use UTC date strings for day comparison so server (UTC) == browser.
    const pad2 = (n: number) => n.toString().padStart(2, "0");
    const sStr = `${sd.getUTCFullYear()}-${pad2(sd.getUTCMonth() + 1)}-${pad2(sd.getUTCDate())}`;
    const eStr = `${ed.getUTCFullYear()}-${pad2(ed.getUTCMonth() + 1)}-${pad2(ed.getUTCDate())}`;
    if (sStr > dateStr || eStr < dateStr) return null;
    const startMin = sStr === dateStr ? sd.getUTCHours() * 60 + sd.getUTCMinutes() : 0;
    const endMin   = eStr === dateStr ? ed.getUTCHours() * 60 + ed.getUTCMinutes() : 24 * 60;
    if (endMin <= startMin) return null;
    return { start: startMin, end: endMin };
  };

  for (const b of blocks) {
    const c = clipUTC(b.start_datetime, b.end_datetime);
    if (c) out.push({ ...c, kind: "block", label: b.label });
  }

  for (const e of events) {
    if (e.is_busy === false) continue;
    if (isAllDayLikeEvent(e.start_time, e.end_time)) continue;
    const c = clipUTC(e.start_time, e.end_time);
    if (c) out.push({ ...c, kind: "event", label: e.label, padOverrideMin: e.padOverrideMin });
  }

  return out;
}

// ---------------------------------------------------------------------------
// Conflict classifier
// ---------------------------------------------------------------------------

function classify(
  slotStart: number,
  slotEnd: number,
  c: TaggedConflict,
  defaultPad: number,
): RejectReason | null {
  const pad    = c.padOverrideMin != null ? c.padOverrideMin : defaultPad;
  const direct = slotStart < c.end && slotEnd > c.start;
  const padded = slotStart < c.end + pad && slotEnd > c.start - pad;
  if (!padded) return null;
  if (direct) return c.kind === "block" ? "overlap_block" : "overlap_event";
  return c.kind === "block" ? "buffer_block" : "buffer_event";
}

// ---------------------------------------------------------------------------
// Core engine — walk the day, emit valid slots
// ---------------------------------------------------------------------------

export function resolveAvailability(input: EngineInput): EngineResult {
  const {
    dayStartMin, dayEndMin, bufferMinutes, durationMinutes,
    conflicts, timeOfDay = "any", isToday, anchorSkipMinutes,
    minNoticeMinutes = 0,
  } = input;

  const padMin = Math.max(0, bufferMinutes); // no hidden travel padding
  const now = new Date();
  const cutoffMin = isToday
    ? now.getUTCHours() * 60 + now.getUTCMinutes() + Math.max(0, minNoticeMinutes)
    : -1;

  const slots: Slot[]         = [];
  const rejected: RejectedSlot[] = [];

  for (let s = dayStartMin; s + durationMinutes <= dayEndMin; s += STEP_MINUTES) {
    const e = s + durationMinutes;

    if (cutoffMin >= 0 && s < cutoffMin) {
      rejected.push({ start: s, end: e, reason: "past" });
      continue;
    }
    if (!inTimeOfDay(s, timeOfDay)) {
      rejected.push({ start: s, end: e, reason: "time_of_day" });
      continue;
    }

    let worstReason: RejectReason | null = null;
    let worstCause: TaggedConflict | undefined;
    for (const c of conflicts) {
      const r = classify(s, e, c, padMin);
      if (!r) continue;
      const isOverlap  = r.startsWith("overlap_");
      const wasOverlap = worstReason?.startsWith("overlap_") ?? false;
      if (!worstReason || (!wasOverlap && isOverlap)) {
        worstReason = r;
        worstCause  = c;
      }
      if (isOverlap) break;
    }

    if (worstReason) {
      rejected.push({ start: s, end: e, reason: worstReason, cause: worstCause });
      continue;
    }

    slots.push({ start: s, end: e });
    if (anchorSkipMinutes && anchorSkipMinutes > STEP_MINUTES) {
      s += anchorSkipMinutes - STEP_MINUTES;
    }
  }

  return { slots, rejected };
}

// ---------------------------------------------------------------------------
// Single-slot validator  (used by create-booking guard and client reschedule)
// ---------------------------------------------------------------------------

export function validateSlot(
  input: Omit<EngineInput, "anchorSkipMinutes"> & { startMin: number },
): { ok: true } | { ok: false; reason: RejectReason; cause?: TaggedConflict } {
  const {
    startMin, durationMinutes, dayStartMin, dayEndMin,
    bufferMinutes, conflicts, timeOfDay = "any", isToday, minNoticeMinutes = 0,
  } = input;

  const endMin = startMin + durationMinutes;

  if (startMin < dayStartMin || endMin > dayEndMin) return { ok: false, reason: "outside_window" };
  if (!inTimeOfDay(startMin, timeOfDay))              return { ok: false, reason: "time_of_day" };

  if (isToday) {
    const now = new Date();
    const cutoff = now.getUTCHours() * 60 + now.getUTCMinutes() + Math.max(0, minNoticeMinutes);
    if (startMin < cutoff) return { ok: false, reason: "past" };
  }

  const padMin = Math.max(0, bufferMinutes);
  let worstReason: RejectReason | null = null;
  let worstCause: TaggedConflict | undefined;
  for (const c of conflicts) {
    const r = classify(startMin, endMin, c, padMin);
    if (!r) continue;
    const isOverlap  = r.startsWith("overlap_");
    const wasOverlap = worstReason?.startsWith("overlap_") ?? false;
    if (!worstReason || (!wasOverlap && isOverlap)) {
      worstReason = r;
      worstCause  = c;
    }
    if (isOverlap) break;
  }

  if (worstReason) return { ok: false, reason: worstReason, cause: worstCause };
  return { ok: true };
}

export function describeReason(
  reason: RejectReason,
  cause?: TaggedConflict,
  padMin?: number,
): string {
  const range = cause ? `${fromMinutes(cause.start)}–${fromMinutes(cause.end)}` : null;
  const label = cause?.label?.trim() || null;
  const effPad = cause?.padOverrideMin != null ? cause.padOverrideMin : padMin;

  // Friendly label fallback per conflict kind.
  const what = label
    ?? (cause?.kind === "block" ? "manual block"
      : cause?.kind === "event" ? "calendar booking"
      : "another booking");

  switch (reason) {
    case "past":          return "Slot is in the past.";
    case "time_of_day":   return "Outside the selected time of day.";
    case "outside_window":return "Outside instructor working hours.";
    case "overlap_block":
    case "overlap_event":
      return range
        ? `Overlaps with ${what} (${range}).`
        : `Conflicts with ${what}.`;
    case "buffer_block":
    case "buffer_event": {
      const padTxt = effPad != null && effPad > 0 ? ` — needs ${effPad} min gap` : "";
      return range
        ? `Too close to ${what} (${range})${padTxt}.`
        : `Too close to ${what}${padTxt}.`;
    }
  }
}
