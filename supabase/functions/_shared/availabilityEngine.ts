// ============================================================================
// UNIFIED AVAILABILITY ENGINE — Deno / Edge Functions copy
// ----------------------------------------------------------------------------
// Deno-compatible mirror of src/lib/availabilityEngine.ts. Kept byte-for-byte
// equivalent in logic — if you change a rule, change it in BOTH files (server
// guard + UI must always agree).
// ============================================================================

export const STEP_MINUTES = 15;
export const TRAVEL_FALLBACK_MIN = 10;
const ALL_DAY_MS = 23 * 60 * 60 * 1000;
const MIDNIGHT_LONG_MS = 12 * 60 * 60 * 1000;

export type ConflictKind = "lesson" | "block" | "event";
export type RejectReason =
  | "past" | "time_of_day" | "outside_window"
  | "overlap_lesson" | "overlap_block" | "overlap_event"
  | "buffer_lesson" | "buffer_block" | "buffer_event";

export interface Slot { start: number; end: number; }
export interface TaggedConflict extends Slot {
  kind: ConflictKind;
  label?: string;
  padOverrideMin?: number;
}

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
 * Google all-day rule — multi-day or midnight-long events are informational
 * only. Must match src/lib/availabilityEngine.ts exactly.
 */
export function isAllDayLikeEvent(startTime: string, endTime: string): boolean {
  try {
    const s = new Date(startTime);
    const e = new Date(endTime);
    const durMs = e.getTime() - s.getTime();
    if (durMs >= ALL_DAY_MS) return true;
    // Note: server runs in UTC, so "starts at midnight" uses UTC hours here.
    // This intentionally matches the browser engine's behaviour for events
    // that Google synced as floating all-day (which arrive as 00:00 UTC).
    const startsAtMidnight = s.getUTCHours() === 0 && s.getUTCMinutes() === 0;
    if (startsAtMidnight && durMs >= MIDNIGHT_LONG_MS) return true;
    return false;
  } catch {
    return true;
  }
}

function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Build the day's conflict list from the three sources.
 * Multi-day items are clipped to the requested date. All-day Google events
 * are dropped (codified rule).
 */
export function buildDayConflicts(
  dateStr: string,
  lessons: Array<{ start_time: string; duration_minutes: number; label?: string }>,
  blocks: Array<{ start_datetime: string; end_datetime: string; label?: string }>,
  events: Array<{ start_time: string; end_time: string; is_busy?: boolean | null; label?: string }>,
): TaggedConflict[] {
  const out: TaggedConflict[] = [];

  for (const l of lessons) {
    const startMin = toMinutes((l.start_time || "").slice(0, 5));
    out.push({
      start: startMin,
      end: startMin + (l.duration_minutes || 60),
      kind: "lesson",
      label: l.label,
    });
  }

  const clip = (sIso: string, eIso: string): Slot | null => {
    const sd = new Date(sIso);
    const ed = new Date(eIso);
    if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return null;
    const sStr = ymd(sd);
    const eStr = ymd(ed);
    if (sStr > dateStr || eStr < dateStr) return null;
    const startMin = sStr === dateStr ? sd.getUTCHours() * 60 + sd.getUTCMinutes() : 0;
    const endMin = eStr === dateStr ? ed.getUTCHours() * 60 + ed.getUTCMinutes() : 24 * 60;
    if (endMin <= startMin) return null;
    return { start: startMin, end: endMin };
  };

  for (const b of blocks) {
    const c = clip(b.start_datetime, b.end_datetime);
    if (c) out.push({ ...c, kind: "block", label: b.label });
  }

  for (const e of events) {
    if (e.is_busy === false) continue;
    if (isAllDayLikeEvent(e.start_time, e.end_time)) continue;
    const c = clip(e.start_time, e.end_time);
    if (c) out.push({ ...c, kind: "event", label: e.label });
  }

  return out;
}

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

export interface ValidateInput {
  startMin: number;
  durationMinutes: number;
  dayStartMin: number;
  dayEndMin: number;
  bufferMinutes: number;
  conflicts: TaggedConflict[];
}

export function validateSlot(
  input: ValidateInput,
): { ok: true } | { ok: false; reason: RejectReason; cause?: TaggedConflict } {
  const { startMin, durationMinutes, dayStartMin, dayEndMin, bufferMinutes, conflicts } = input;
  const endMin = startMin + durationMinutes;

  if (startMin < dayStartMin || endMin > dayEndMin) {
    return { ok: false, reason: "outside_window" };
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

export function describeReason(reason: RejectReason): string {
  switch (reason) {
    case "past": return "Slot is in the past";
    case "time_of_day": return "Outside selected time of day";
    case "outside_window": return "Outside instructor working hours";
    case "overlap_lesson": return "Conflicts with an existing lesson";
    case "overlap_block": return "Conflicts with an instructor block";
    case "overlap_event": return "Conflicts with a Google Calendar event";
    case "buffer_lesson": return "Too close to another lesson (buffer + travel)";
    case "buffer_block": return "Too close to a manual block (buffer + travel)";
    case "buffer_event": return "Too close to a Google Calendar event (buffer + travel)";
  }
}
