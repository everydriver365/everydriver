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
//   7. ONE clock: Europe/London. Every "today"/"now" decision goes through
//      toLondonParts(). Never getUTCHours(), never new Date().getHours().
//   8. No invented availability. Missing/unparseable input → "not available".
//
// The Deno edge-function copy (supabase/functions/_shared/availabilityEngine.ts)
// must stay byte-for-byte logically identical to this file.
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
  /** yyyy-MM-dd (Europe/London calendar date) */
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
  preferEarliestSlot?: boolean;
}


export interface EngineResult {
  slots: Slot[];
  rejected: RejectedSlot[];
}

// ---------------------------------------------------------------------------
// Pure helpers (exported — reused by wrappers)
// ---------------------------------------------------------------------------

/**
 * Strict HH:MM (or HH:MM:SS) parser. Returns minutes-since-midnight, or
 * `null` if the input is missing or unparseable. Callers in the availability
 * path MUST treat `null` as "no data → not available", never as midnight.
 */
export function parseHHMM(t: string | null | undefined): number | null {
  if (t == null) return null;
  const trimmed = String(t).trim();
  if (!trimmed) return null;
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(trimmed);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const mins = parseInt(m[2], 10);
  if (!Number.isFinite(h) || !Number.isFinite(mins)) return null;
  if (h < 0 || h > 24 || mins < 0 || mins > 59) return null;
  const total = h * 60 + mins;
  if (total > 24 * 60) return null;
  return total;
}

/**
 * Legacy lossy parser. Returns 0 for bad input. NOT for use in availability
 * decisions — use {@link parseHHMM} there. Kept for callers (pricing, clash
 * check, create-booking) that pass already-validated DB time strings.
 */
export function toMinutes(t: string): number {
  return parseHHMM(t) ?? 0;
}

export function fromMinutes(min: number): string {
  return `${Math.floor(min / 60).toString().padStart(2, "0")}:${(min % 60).toString().padStart(2, "0")}`;
}

/**
 * Returns true for events that should be IGNORED as booking conflicts:
 *   - Duration ≥ 23 h  (multi-day / term events)
 *   - Starts at 00:00 UTC and duration ≥ 12 h  (Google all-day sync format)
 *
 * Fails CLOSED: malformed or unparseable datetimes return `false`, so a bad
 * event is treated as a real blocking conflict rather than silently freeing
 * the slot.
 */
export function isAllDayLikeEvent(startIso: string, endIso: string): boolean {
  try {
    const s = new Date(startIso);
    const e = new Date(endIso);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return false;
    const durMs = e.getTime() - s.getTime();
    if (!Number.isFinite(durMs) || durMs <= 0) return false;
    if (durMs >= ALL_DAY_MS) return true;
    const startsAtMidnightUTC = s.getUTCHours() === 0 && s.getUTCMinutes() === 0;
    return startsAtMidnightUTC && durMs >= MIDNIGHT_LONG_MS;
  } catch {
    return false; // fail closed
  }
}

// Cached formatter — extracts wall-clock date + time parts in Europe/London,
// honouring BST/GMT transitions. Works identically in Node, browser, and Deno.
const LONDON_PARTS_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hour12: false,
});

export function toLondonParts(d: Date): { date: string; hour: number; minute: number } {
  const parts = LONDON_PARTS_FMT.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0; // some runtimes report "24" for midnight
  const minute = parseInt(get("minute"), 10);
  return { date: `${year}-${month}-${day}`, hour, minute };
}

/** London-time "now" cutoff in minutes-of-day. */
function londonNowMin(): number {
  const p = toLondonParts(new Date());
  return p.hour * 60 + p.minute;
}

/** London-time today's date string (yyyy-MM-dd). */
export function londonTodayStr(): string {
  return toLondonParts(new Date()).date;
}

/** London-time day-of-week for a given instant (0=Sun..6=Sat). */
export function londonDow(d: Date): number {
  // Derive via the London date string so DST transitions are honoured.
  const { date } = toLondonParts(d);
  // Construct a UTC Date at noon on that London calendar day — noon avoids
  // any ambiguity around DST boundaries when reading getUTCDay.
  const utc = new Date(`${date}T12:00:00Z`);
  return utc.getUTCDay();
}

/** London-calendar date string for a given instant. */
export function londonDateStr(d: Date): string {
  return toLondonParts(d).date;
}

export function inTimeOfDay(startMin: number, tod: TimeOfDay = "any"): boolean {
  if (tod === "any")       return true;
  if (tod === "morning")   return startMin >= 6 * 60 && startMin < 12 * 60;
  if (tod === "afternoon") return startMin >= 12 * 60 && startMin < 17 * 60;
  if (tod === "evening")   return startMin >= 17 * 60 && startMin < 22 * 60;
  return true;
}

/**
 * Merge overlapping or adjacent [start,end) intervals. Pure helper exported
 * so the day-level resolver can normalise clipped conflicts before doing
 * gap-pairing math.
 */
export function mergeIntervals<T extends Slot>(intervals: T[]): Slot[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const out: Slot[] = [{ start: sorted[0].start, end: sorted[0].end }];
  for (let i = 1; i < sorted.length; i++) {
    const last = out[out.length - 1];
    const cur = sorted[i];
    if (cur.start <= last.end) {
      if (cur.end > last.end) last.end = cur.end;
    } else {
      out.push({ start: cur.start, end: cur.end });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Conflict builder
// ---------------------------------------------------------------------------

/**
 * Convert raw DB rows into the TaggedConflict shape the engine consumes.
 *
 * - scheduled_lessons are NOT passed in (rule 5 above — calendar is the record).
 * - All-day Google events are silently dropped.
 * - Multi-day blocks/events are clipped to this calendar day in London time.
 * - `is_busy` is expected to be normalised by the caller (loader) — any
 *   row reaching this function with `is_busy === false` is treated as free.
 *   `null`/`undefined` means "busy" (fail closed), but the loader should
 *   already have applied that default.
 */
export function buildDayConflicts(
  dateStr: string,
  blocks: Array<{ start_datetime: string; end_datetime: string; label?: string }>,
  events: Array<{ start_time: string; end_time: string; is_busy?: boolean | null; label?: string; padOverrideMin?: number }>,
): TaggedConflict[] {
  const out: TaggedConflict[] = [];

  // Clip in **Europe/London local minutes-of-day** — working-hours strings
  // ("09:00") are local clock minutes, so conflicts MUST also be expressed
  // in local clock minutes.
  const clipLondon = (sIso: string, eIso: string): Slot | null => {
    const sd = new Date(sIso);
    const ed = new Date(eIso);
    if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return null;
    const sP = toLondonParts(sd);
    const eP = toLondonParts(ed);
    if (sP.date > dateStr || eP.date < dateStr) return null;
    const startMin = sP.date === dateStr ? sP.hour * 60 + sP.minute : 0;
    const endMin   = eP.date === dateStr ? eP.hour * 60 + eP.minute : 24 * 60;
    if (endMin <= startMin) return null;
    return { start: startMin, end: endMin };
  };

  for (const b of blocks) {
    const c = clipLondon(b.start_datetime, b.end_datetime);
    if (c) out.push({ ...c, kind: "block", label: b.label });
  }

  for (const e of events) {
    // Fail-closed default: only explicit `false` releases the slot.
    if (e.is_busy === false) continue;
    if (isAllDayLikeEvent(e.start_time, e.end_time)) continue;
    const c = clipLondon(e.start_time, e.end_time);
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
    dateStr, dayStartMin, dayEndMin, bufferMinutes, durationMinutes,
    conflicts, timeOfDay = "any", isToday, anchorSkipMinutes,
    minNoticeMinutes = 0,
  } = input;

  const padMin = Math.max(0, bufferMinutes); // no hidden travel padding
  // Past-cutoff is computed in Europe/London wall-clock to match how
  // working hours, conflicts and the `isToday` flag are expressed.
  // Guard against stale `isToday=true` from a previous render by also
  // confirming dateStr matches London today.
  const cutoffMin = (isToday === true && dateStr === londonTodayStr())
    ? londonNowMin() + Math.max(0, minNoticeMinutes)
    : -1;

  // Slot grid: accepted slots must land on a stride anchored to dayStartMin.
  // Internal iteration stays at STEP_MINUTES so the `rejected` list remains
  // complete (one entry per 15-min candidate).
  const stride = Math.max(STEP_MINUTES, anchorSkipMinutes ?? STEP_MINUTES);

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

    // Free candidate — only emit if it lands on the stride grid.
    if ((s - dayStartMin) % stride === 0) {
      slots.push({ start: s, end: e });
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
    dateStr, startMin, durationMinutes, dayStartMin, dayEndMin,
    bufferMinutes, conflicts, timeOfDay = "any", isToday, minNoticeMinutes = 0,
  } = input;

  const endMin = startMin + durationMinutes;

  if (startMin < dayStartMin || endMin > dayEndMin) return { ok: false, reason: "outside_window" };
  if (!inTimeOfDay(startMin, timeOfDay))              return { ok: false, reason: "time_of_day" };

  if (isToday === true && dateStr === londonTodayStr()) {
    const cutoff = londonNowMin() + Math.max(0, minNoticeMinutes);
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
