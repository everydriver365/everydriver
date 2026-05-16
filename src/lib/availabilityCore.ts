// ----------------------------------------------------------------------------
// availabilityCore.ts
//
// THIN WRAPPER over the unified availability engine (src/lib/availabilityEngine.ts).
// All slot/conflict logic now lives in the engine — this file only re-exports
// the legacy API surface so existing callers (Find Slot, Fill Gaps, etc.)
// keep working without changes. Do not add new logic here; extend the engine.
// ----------------------------------------------------------------------------
import {
  resolveAvailability,
  buildDayConflicts as engineBuildDayConflicts,
  describeReason as engineDescribeReason,
  toMinutes as engineToMinutes,
  fromMinutes as engineFromMinutes,
  inTimeOfDay as engineInTimeOfDay,
  STEP_MINUTES as ENGINE_STEP_MINUTES,
  TRAVEL_FALLBACK_MIN as ENGINE_TRAVEL_FALLBACK_MIN,
  type TaggedConflict as EngineTaggedConflict,
  type RejectReason as EngineRejectReason,
  type Slot as EngineSlot,
  type TimeOfDay as EngineTimeOfDay,
} from "./availabilityEngine";

export const STEP_MINUTES = ENGINE_STEP_MINUTES;
// Engine now applies travel padding (10 min) on top of bufferMinutes.
// Legacy callers expected this to be 0; restore that expectation for code
// that did `bufferMinutes + TRAVEL_FALLBACK_MIN` manually by exposing it as 0
// here. The engine internally still adds TRAVEL_FALLBACK_MIN.
export const TRAVEL_FALLBACK_MIN = 0;
export const ENGINE_TRAVEL_PADDING = ENGINE_TRAVEL_FALLBACK_MIN;

export type TimeOfDay = EngineTimeOfDay;
export type ConflictKind = EngineTaggedConflict["kind"];
export type RejectReason = EngineRejectReason;
export type CoreSlot = EngineSlot;
export type TaggedConflict = EngineTaggedConflict;

export interface RejectedSlot extends CoreSlot {
  reason: RejectReason;
}

export interface DayInputs {
  dateStr: string;
  dayStartMin: number;
  dayEndMin: number;
  bufferMinutes: number;
  durationMinutes: number;
  timeOfDay?: TimeOfDay;
  conflicts: TaggedConflict[];
  isToday?: boolean;
  anchorSkipMinutes?: number;
}

export const toMinutes = engineToMinutes;
export const fromMinutes = engineFromMinutes;
export const inTimeOfDay = engineInTimeOfDay;

export function buildDayConflicts(
  dateStr: string,
  lessons: { start_time: string; duration_minutes: number; pupil_travel_min?: number | null }[],
  blocks: { start_datetime: string; end_datetime: string }[],
  events: { start_time: string; end_time: string }[],
): TaggedConflict[] {
  // Legacy callers don't filter all-day Google events upstream — engine does.
  return engineBuildDayConflicts(dateStr, lessons, blocks, events);
}

export function describeReason(reason: RejectReason, padMin: number): string {
  return engineDescribeReason(reason, padMin);
}

export function computeFreeSlots(input: DayInputs): CoreSlot[] {
  return resolveAvailability(input).slots;
}

export function computeSlotResult(input: DayInputs): {
  slots: CoreSlot[];
  rejected: RejectedSlot[];
  padMin: number;
} {
  const r = resolveAvailability(input);
  return {
    slots: r.slots,
    rejected: r.rejected.map(({ start, end, reason }) => ({ start, end, reason })),
    padMin: input.bufferMinutes + ENGINE_TRAVEL_FALLBACK_MIN,
  };
}

export function classifyConflict(
  slotStart: number,
  slotEnd: number,
  c: TaggedConflict,
  padMin: number,
): RejectReason | null {
  // Re-classify via the engine by single-slot probe.
  const effectivePad = c.padOverrideMin != null ? c.padOverrideMin + ENGINE_TRAVEL_FALLBACK_MIN : padMin;
  const direct = slotStart < c.end && slotEnd > c.start;
  const padded = slotStart < c.end + effectivePad && slotEnd > c.start - effectivePad;
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
