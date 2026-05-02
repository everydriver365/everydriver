/**
 * State machine for the Next Lesson card UI.
 *
 * Centralised here so the visibility rules can be unit-tested in isolation
 * (the parent component is ~1600 lines and pulls in maps, supabase, etc.).
 *
 * States — derived from `minutesUntil` + `lessonStatus`:
 *   - "in_lesson"     : lessonStatus === "in_progress"  → End lesson CTA only
 *   - "starting_now"  : 0 ≤ minutesUntil ≤ 15           → Start lesson CTA only
 *   - "mid"           : 15 < minutesUntil ≤ 60          → Quick action row only
 *   - "early"         : minutesUntil > 60               → Inline mini icons only
 *
 * Visibility flags:
 *   - showStartLessonButton    full-width primary
 *   - showEndLessonButton      full-width destructive
 *   - showQuickActionRow       Navigate / Call / Message / Arrived row
 *   - showInlineMiniActions    small Call + Navigate icons in the header
 */

export type NextUpState = "early" | "mid" | "starting_now" | "in_lesson";

export interface NextUpVisibility {
  state: NextUpState;
  showStartLessonButton: boolean;
  showEndLessonButton: boolean;
  showQuickActionRow: boolean;
  showInlineMiniActions: boolean;
}

export function getNextUpState(
  minutesUntil: number,
  lessonStatus: string | null | undefined,
): NextUpState {
  if (lessonStatus === "in_progress") return "in_lesson";
  if (minutesUntil <= 15) return "starting_now";
  if (minutesUntil <= 60) return "mid";
  return "early";
}

export function getNextUpVisibility(
  minutesUntil: number,
  lessonStatus: string | null | undefined,
): NextUpVisibility {
  const state = getNextUpState(minutesUntil, lessonStatus);
  return {
    state,
    showStartLessonButton: state === "starting_now",
    showEndLessonButton: state === "in_lesson",
    showQuickActionRow: state === "mid",
    // Inline mini call/navigate icons live in the header — they're useful in
    // every "before lesson" state, but we hide them once the lesson is live.
    showInlineMiniActions: state !== "in_lesson",
  };
}
