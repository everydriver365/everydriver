import { describe, it, expect } from "vitest";
import {
  getNextUpState,
  getNextUpVisibility,
} from "../nextUpTileState";

/**
 * These tests lock the state-based action system on the Next Lesson card:
 *   early        → only inline mini call/navigate icons
 *   mid          → quick action row (Navigate / Call / Message / Arrived)
 *   starting_now → full-width Start lesson CTA only
 *   in_lesson    → full-width End lesson CTA only
 */

describe("getNextUpState", () => {
  it("returns 'in_lesson' whenever the lesson is in progress, regardless of minutesUntil", () => {
    expect(getNextUpState(0, "in_progress")).toBe("in_lesson");
    expect(getNextUpState(45, "in_progress")).toBe("in_lesson");
    expect(getNextUpState(9999, "in_progress")).toBe("in_lesson");
    expect(getNextUpState(-30, "in_progress")).toBe("in_lesson");
  });

  it("returns 'starting_now' from 0 up to and including 15 minutes before the lesson", () => {
    expect(getNextUpState(0, null)).toBe("starting_now");
    expect(getNextUpState(1, null)).toBe("starting_now");
    expect(getNextUpState(15, null)).toBe("starting_now");
  });

  it("treats overdue (negative) lessons as 'starting_now' so the Start CTA stays available", () => {
    expect(getNextUpState(-5, null)).toBe("starting_now");
    expect(getNextUpState(-60, undefined)).toBe("starting_now");
  });

  it("returns 'mid' between 15 (exclusive) and 60 (inclusive) minutes before the lesson", () => {
    expect(getNextUpState(16, null)).toBe("mid");
    expect(getNextUpState(30, null)).toBe("mid");
    expect(getNextUpState(45, "scheduled")).toBe("mid");
    expect(getNextUpState(60, null)).toBe("mid");
  });

  it("returns 'early' for anything more than 60 minutes away", () => {
    expect(getNextUpState(61, null)).toBe("early");
    expect(getNextUpState(120, null)).toBe("early");
    expect(getNextUpState(60 * 24, "scheduled")).toBe("early");
  });

  it("ignores non-'in_progress' status values when computing time-based state", () => {
    for (const status of [null, undefined, "scheduled", "confirmed", "completed", "cancelled"] as const) {
      expect(getNextUpState(120, status)).toBe("early");
      expect(getNextUpState(30, status)).toBe("mid");
      expect(getNextUpState(5, status)).toBe("starting_now");
    }
  });
});

describe("getNextUpVisibility", () => {
  it("EARLY: shows only the inline mini call/navigate icons", () => {
    const v = getNextUpVisibility(120, "scheduled");
    expect(v.state).toBe("early");
    expect(v.showStartLessonButton).toBe(false);
    expect(v.showEndLessonButton).toBe(false);
    expect(v.showQuickActionRow).toBe(false);
    expect(v.showInlineMiniActions).toBe(true);
  });

  it("MID: shows the quick action row, no full-width CTA", () => {
    const v = getNextUpVisibility(45, "scheduled");
    expect(v.state).toBe("mid");
    expect(v.showStartLessonButton).toBe(false);
    expect(v.showEndLessonButton).toBe(false);
    expect(v.showQuickActionRow).toBe(true);
    expect(v.showInlineMiniActions).toBe(true);
  });

  it("STARTING NOW: shows ONLY the full-width Start lesson button", () => {
    const v = getNextUpVisibility(10, "scheduled");
    expect(v.state).toBe("starting_now");
    expect(v.showStartLessonButton).toBe(true);
    expect(v.showEndLessonButton).toBe(false);
    expect(v.showQuickActionRow).toBe(false);
    expect(v.showInlineMiniActions).toBe(true);
  });

  it("IN LESSON: replaces Start with End and hides the quick row + mini icons", () => {
    const v = getNextUpVisibility(0, "in_progress");
    expect(v.state).toBe("in_lesson");
    expect(v.showStartLessonButton).toBe(false);
    expect(v.showEndLessonButton).toBe(true);
    expect(v.showQuickActionRow).toBe(false);
    expect(v.showInlineMiniActions).toBe(false);
  });

  it("never surfaces both a primary CTA and the quick action row at the same time", () => {
    const samples: Array<[number, string | null]> = [
      [-10, null], [0, null], [5, null], [15, null],
      [16, null], [30, null], [60, null],
      [61, null], [120, null], [600, null],
      [0, "in_progress"], [45, "in_progress"], [120, "in_progress"],
    ];
    for (const [minutesUntil, status] of samples) {
      const v = getNextUpVisibility(minutesUntil, status);
      const primaryShown = v.showStartLessonButton || v.showEndLessonButton;
      expect(
        primaryShown && v.showQuickActionRow,
        `duplicate actions at minutesUntil=${minutesUntil}, status=${status}`,
      ).toBe(false);
    }
  });

  it("never shows both Start and End buttons simultaneously", () => {
    for (const m of [-30, 0, 5, 15, 30, 60, 120]) {
      for (const s of [null, "scheduled", "in_progress"] as const) {
        const v = getNextUpVisibility(m, s);
        expect(v.showStartLessonButton && v.showEndLessonButton).toBe(false);
      }
    }
  });
});
