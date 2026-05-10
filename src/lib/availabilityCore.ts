// Shared availability computation used by Find Slot AND Fill Gaps.
// Any change here affects both — keeps the two systems in lock-step.
import { format } from "date-fns";

export const STEP_MINUTES = 15;
export const TRAVEL_FALLBACK_MIN = 10;

export type TimeOfDay = "any" | "morning" | "afternoon" | "evening";

export type ConflictKind = "lesson" | "block" | "event";

export interface CoreSlot {
  start: number; // minutes from midnight
  end: number;
}

export interface TaggedConflict extends CoreSlot {
  kind: ConflictKind;
  /**
   * Per-conflict buffer override in minutes (e.g. a pupil's travel_time_minutes).
   * When set, this REPLACES the instructor's default buffer (TRAVEL_FALLBACK_MIN
   * is still added on top). When undefined, the default `bufferMinutes` is used.
   */
  padOverrideMin?: number;
}

export type RejectReason =
  | "past"
  | "time_of_day"
  | "overlap_lesson"
  | "overlap_block"
  | "overlap_event"
  | "buffer_lesson"
  | "buffer_block"
  | "buffer_event";

export interface RejectedSlot extends CoreSlot {
  reason: RejectReason;
}

export interface DayInputs {
  dateStr: string; // yyyy-MM-dd
  dayStartMin: number;
  dayEndMin: number;
  bufferMinutes: number;
  durationMinutes: number;
  timeOfDay?: TimeOfDay;
  // Conflicts: scheduled_lessons + manual blocks + Google Calendar events
  conflicts: TaggedConflict[];
  // If true, slots in the past are filtered (use for "today")
  isToday?: boolean;
  // If set, after each emitted slot we skip forward by this many minutes.
  // Find Slot uses 60 (one anchor per hour); Fill Gaps does not set this.
  anchorSkipMinutes?: number;
}

export function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}
export function fromMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function inTimeOfDay(startMin: number, tod: TimeOfDay = "any") {
  if (tod === "any") return true;
  if (tod === "morning") return startMin >= 6 * 60 && startMin < 12 * 60;
  if (tod === "afternoon") return startMin >= 12 * 60 && startMin < 17 * 60;
  if (tod === "evening") return startMin >= 17 * 60 && startMin < 22 * 60;
  return true;
}

/**
 * Build conflict windows for a given day from raw scheduled_lessons + manual_blocks +
 * calendar_events rows. Multi-day blocks/events are clipped to the day boundaries.
 */
export function buildDayConflicts(
  dateStr: string,
  lessons: { start_time: string; duration_minutes: number; pupil_travel_min?: number | null }[],
  blocks: { start_datetime: string; end_datetime: string }[],
  events: { start_time: string; end_time: string }[],
): TaggedConflict[] {
  const out: TaggedConflict[] = [];

  for (const l of lessons) {
    const s = toMinutes(l.start_time);
    out.push({
      start: s,
      end: s + (l.duration_minutes || 60),
      kind: "lesson",
      padOverrideMin: l.pupil_travel_min ?? undefined,
    });
  }

  const clip = (sIso: string, eIso: string) => {
    const sd = new Date(sIso);
    const ed = new Date(eIso);
    const sStr = format(sd, "yyyy-MM-dd");
    const eStr = format(ed, "yyyy-MM-dd");
    if (sStr !== dateStr && eStr !== dateStr) return null;
    return {
      start: sStr === dateStr ? sd.getHours() * 60 + sd.getMinutes() : 0,
      end: eStr === dateStr ? ed.getHours() * 60 + ed.getMinutes() : 24 * 60,
    };
  };

  for (const b of blocks) {
    const c = clip(b.start_datetime, b.end_datetime);
    if (c) out.push({ ...c, kind: "block" });
  }
  for (const e of events) {
    const c = clip(e.start_time, e.end_time);
    if (c) out.push({ ...c, kind: "event" });
  }

  return out;
}

/**
 * Classify why a candidate slot fails for a given conflict, or null if it doesn't.
 * - direct overlap → "overlap_*"
 * - touches the buffer/travel padding → "buffer_*"
 */
export function classifyConflict(
  slotStart: number,
  slotEnd: number,
  c: TaggedConflict,
  padMin: number,
): RejectReason | null {
  const direct = slotStart < c.end && slotEnd > c.start;
  const padded = slotStart < c.end + padMin && slotEnd > c.start - padMin;
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
    case "past":
      return "Slot is in the past.";
    case "time_of_day":
      return "Outside the selected time of day.";
    case "overlap_lesson":
      return "Overlaps an existing lesson.";
    case "overlap_block":
      return "Overlaps a manual block.";
    case "overlap_event":
      return "Overlaps a Google Calendar event.";
    case "buffer_lesson":
      return `Too close to another lesson (needs ${padMin} min buffer + travel).`;
    case "buffer_block":
      return `Too close to a manual block (needs ${padMin} min buffer + travel).`;
    case "buffer_event":
      return `Too close to a Google Calendar event (needs ${padMin} min buffer + travel).`;
  }
}

/**
 * Core slot finder. Inflates each conflict window by `bufferMinutes + 10` on each side
 * (Fill Gaps rule) so we never offer a slot that touches another commitment.
 *
 * Returns both passing slots and a `rejected` list (with reasons) so the UI can
 * explain *why* a slot is missing.
 */
export function computeFreeSlots(input: DayInputs): CoreSlot[] {
  return computeSlotResult(input).slots;
}

export function computeSlotResult(input: DayInputs): {
  slots: CoreSlot[];
  rejected: RejectedSlot[];
  padMin: number;
} {
  const {
    dayStartMin,
    dayEndMin,
    bufferMinutes,
    durationMinutes,
    timeOfDay = "any",
    conflicts,
    isToday,
    anchorSkipMinutes,
  } = input;

  const padMin = bufferMinutes + TRAVEL_FALLBACK_MIN;
  const nowMin = isToday
    ? new Date().getHours() * 60 + new Date().getMinutes()
    : 0;

  const slots: CoreSlot[] = [];
  const rejected: RejectedSlot[] = [];

  for (let s = dayStartMin; s + durationMinutes <= dayEndMin; s += STEP_MINUTES) {
    const e = s + durationMinutes;
    if (isToday && s < nowMin) {
      rejected.push({ start: s, end: e, reason: "past" });
      continue;
    }
    if (!inTimeOfDay(s, timeOfDay)) {
      rejected.push({ start: s, end: e, reason: "time_of_day" });
      continue;
    }

    let reason: RejectReason | null = null;
    for (const c of conflicts) {
      const r = classifyConflict(s, e, c, padMin);
      if (r) {
        // Prefer a direct overlap reason over a buffer one if both exist.
        if (!reason || (reason.startsWith("buffer_") && r.startsWith("overlap_"))) {
          reason = r;
        }
        if (r.startsWith("overlap_")) break;
      }
    }
    if (reason) {
      rejected.push({ start: s, end: e, reason });
      continue;
    }

    slots.push({ start: s, end: e });

    if (anchorSkipMinutes && anchorSkipMinutes > STEP_MINUTES) {
      s += anchorSkipMinutes - STEP_MINUTES;
    }
  }
  return { slots, rejected, padMin };
}
