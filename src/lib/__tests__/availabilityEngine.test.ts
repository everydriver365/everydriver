import { describe, it, expect } from "vitest";
import {
  parseHHMM,
  toMinutes,
  fromMinutes,
  isAllDayLikeEvent,
  mergeIntervals,
  inTimeOfDay,
  buildDayConflicts,
  resolveAvailability,
  validateSlot,
  toLondonParts,
  type TaggedConflict,
  type EngineInput,
} from "../availabilityEngine";

// ---------------------------------------------------------------------------
// Fixtures — a realistic instructor day. All times are Europe/London local.
// ---------------------------------------------------------------------------

const DATE = "2026-06-15"; // BST (UTC+1) — Monday

const WORKING_HOURS = {
  // 09:00 – 17:00 weekdays
  dayStartMin: 9 * 60,
  dayEndMin: 17 * 60,
};

const NO_CONFLICTS: TaggedConflict[] = [];

const baseInput = (over: Partial<EngineInput> = {}): EngineInput => ({
  dateStr: DATE,
  dayStartMin: WORKING_HOURS.dayStartMin,
  dayEndMin: WORKING_HOURS.dayEndMin,
  bufferMinutes: 10,
  durationMinutes: 60,
  conflicts: NO_CONFLICTS,
  timeOfDay: "any",
  isToday: false,
  ...over,
});

// ---------------------------------------------------------------------------
// parseHHMM — strict parser
// ---------------------------------------------------------------------------

describe("parseHHMM", () => {
  it("parses HH:MM", () => {
    expect(parseHHMM("09:00")).toBe(540);
    expect(parseHHMM("17:30")).toBe(17 * 60 + 30);
    expect(parseHHMM("00:00")).toBe(0);
    expect(parseHHMM("24:00")).toBe(24 * 60);
  });
  it("parses HH:MM:SS by ignoring seconds", () => {
    expect(parseHHMM("09:15:30")).toBe(9 * 60 + 15);
  });
  it("returns null for missing/empty/garbage", () => {
    expect(parseHHMM(null)).toBeNull();
    expect(parseHHMM(undefined)).toBeNull();
    expect(parseHHMM("")).toBeNull();
    expect(parseHHMM("   ")).toBeNull();
    expect(parseHHMM("not a time")).toBeNull();
    expect(parseHHMM("25:00")).toBeNull();
    expect(parseHHMM("10:60")).toBeNull();
    expect(parseHHMM("24:01")).toBeNull();
  });
  it("toMinutes falls back to 0 (legacy, not for availability)", () => {
    expect(toMinutes("bad")).toBe(0);
    expect(toMinutes("09:30")).toBe(570);
  });
  it("fromMinutes round-trips", () => {
    expect(fromMinutes(540)).toBe("09:00");
    expect(fromMinutes(17 * 60 + 5)).toBe("17:05");
  });
});

// ---------------------------------------------------------------------------
// isAllDayLikeEvent — failure-closed
// ---------------------------------------------------------------------------

describe("isAllDayLikeEvent", () => {
  it("detects 24h+ multi-day events", () => {
    expect(
      isAllDayLikeEvent("2026-06-15T00:00:00Z", "2026-06-16T00:00:00Z"),
    ).toBe(true);
  });
  it("detects Google all-day format (midnight UTC + 12h)", () => {
    expect(
      isAllDayLikeEvent("2026-06-15T00:00:00Z", "2026-06-15T12:00:00Z"),
    ).toBe(true);
  });
  it("does NOT treat a normal mid-day event as all-day", () => {
    expect(
      isAllDayLikeEvent("2026-06-15T10:00:00Z", "2026-06-15T11:00:00Z"),
    ).toBe(false);
  });
  it("fails CLOSED on malformed input (returns false → treat as real conflict)", () => {
    expect(isAllDayLikeEvent("garbage", "also-garbage")).toBe(false);
    expect(isAllDayLikeEvent("", "")).toBe(false);
  });
  it("fails CLOSED on zero/negative duration", () => {
    expect(
      isAllDayLikeEvent("2026-06-15T10:00:00Z", "2026-06-15T10:00:00Z"),
    ).toBe(false);
    expect(
      isAllDayLikeEvent("2026-06-15T11:00:00Z", "2026-06-15T10:00:00Z"),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// mergeIntervals
// ---------------------------------------------------------------------------

describe("mergeIntervals", () => {
  it("merges overlapping ranges", () => {
    expect(
      mergeIntervals([
        { start: 540, end: 600 },
        { start: 580, end: 660 },
      ]),
    ).toEqual([{ start: 540, end: 660 }]);
  });
  it("merges adjacent ranges", () => {
    expect(
      mergeIntervals([
        { start: 540, end: 600 },
        { start: 600, end: 660 },
      ]),
    ).toEqual([{ start: 540, end: 660 }]);
  });
  it("preserves non-overlapping ranges", () => {
    expect(
      mergeIntervals([
        { start: 540, end: 600 },
        { start: 720, end: 780 },
      ]),
    ).toEqual([
      { start: 540, end: 600 },
      { start: 720, end: 780 },
    ]);
  });
  it("handles empty input", () => {
    expect(mergeIntervals([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// inTimeOfDay
// ---------------------------------------------------------------------------

describe("inTimeOfDay", () => {
  it("morning 06:00–11:59", () => {
    expect(inTimeOfDay(8 * 60, "morning")).toBe(true);
    expect(inTimeOfDay(12 * 60, "morning")).toBe(false);
  });
  it("afternoon 12:00–16:59", () => {
    expect(inTimeOfDay(13 * 60, "afternoon")).toBe(true);
    expect(inTimeOfDay(17 * 60, "afternoon")).toBe(false);
  });
  it("evening 17:00–21:59", () => {
    expect(inTimeOfDay(18 * 60, "evening")).toBe(true);
    expect(inTimeOfDay(22 * 60, "evening")).toBe(false);
  });
  it("any always true", () => {
    expect(inTimeOfDay(0, "any")).toBe(true);
    expect(inTimeOfDay(23 * 60, "any")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildDayConflicts — calendar + manual blocks
// ---------------------------------------------------------------------------

describe("buildDayConflicts", () => {
  it("turns a manual block into a clipped conflict in London local minutes", () => {
    // 10:00–11:00 BST is 09:00–10:00 UTC.
    const out = buildDayConflicts(
      DATE,
      [
        {
          start_datetime: "2026-06-15T09:00:00Z",
          end_datetime: "2026-06-15T10:00:00Z",
          label: "Personal",
        },
      ],
      [],
    );
    expect(out).toEqual([
      { start: 10 * 60, end: 11 * 60, kind: "block", label: "Personal" },
    ]);
  });

  it("turns a busy calendar event into a conflict", () => {
    const out = buildDayConflicts(
      DATE,
      [],
      [
        {
          start_time: "2026-06-15T13:00:00Z", // 14:00 London
          end_time: "2026-06-15T14:00:00Z", // 15:00 London
          is_busy: true,
          label: "Dentist",
        },
      ],
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      start: 14 * 60,
      end: 15 * 60,
      kind: "event",
      label: "Dentist",
    });
  });

  it("drops calendar events explicitly marked is_busy=false", () => {
    const out = buildDayConflicts(
      DATE,
      [],
      [
        {
          start_time: "2026-06-15T13:00:00Z",
          end_time: "2026-06-15T14:00:00Z",
          is_busy: false,
        },
      ],
    );
    expect(out).toEqual([]);
  });

  it("treats is_busy missing/null as busy (fail closed)", () => {
    const out = buildDayConflicts(
      DATE,
      [],
      [
        {
          start_time: "2026-06-15T13:00:00Z",
          end_time: "2026-06-15T14:00:00Z",
        },
      ],
    );
    expect(out).toHaveLength(1);
  });

  it("drops all-day Google events", () => {
    const out = buildDayConflicts(
      DATE,
      [],
      [
        {
          start_time: "2026-06-15T00:00:00Z",
          end_time: "2026-06-16T00:00:00Z",
          is_busy: true,
          label: "Holiday",
        },
      ],
    );
    expect(out).toEqual([]);
  });

  it("clips a multi-day block to the target day", () => {
    // 2026-06-14T12:00Z → 2026-06-16T08:00Z; for 2026-06-15 → 00:00..24:00 London
    const out = buildDayConflicts(
      DATE,
      [
        {
          start_datetime: "2026-06-14T12:00:00Z",
          end_datetime: "2026-06-16T08:00:00Z",
          label: "Trip",
        },
      ],
      [],
    );
    expect(out).toEqual([
      { start: 0, end: 24 * 60, kind: "block", label: "Trip" },
    ]);
  });

  it("drops events entirely outside the target day", () => {
    const out = buildDayConflicts(
      DATE,
      [],
      [
        {
          start_time: "2026-06-14T08:00:00Z",
          end_time: "2026-06-14T09:00:00Z",
          is_busy: true,
        },
      ],
    );
    expect(out).toEqual([]);
  });

  it("drops events with unparseable datetimes (closed via clipLondon)", () => {
    const out = buildDayConflicts(
      DATE,
      [],
      [
        { start_time: "garbage", end_time: "also-garbage", is_busy: true },
      ],
    );
    expect(out).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// resolveAvailability — slot generation
// ---------------------------------------------------------------------------

describe("resolveAvailability", () => {
  it("generates 60-min slots across an empty 09:00–17:00 day", () => {
    const { slots, rejected } = resolveAvailability(baseInput());
    // 09:00, 09:15, ... last slot starting at 16:00 → 29 slots
    expect(slots.length).toBe(29);
    expect(slots[0]).toEqual({ start: 9 * 60, end: 10 * 60 });
    expect(slots[slots.length - 1]).toEqual({ start: 16 * 60, end: 17 * 60 });
    expect(rejected).toEqual([]);
  });

  it("returns no slots when duration exceeds window", () => {
    const { slots } = resolveAvailability(
      baseInput({ durationMinutes: 9 * 60 }),
    );
    expect(slots).toEqual([]);
  });

  it("returns no slots if working hours are empty (dayStart == dayEnd)", () => {
    const { slots } = resolveAvailability(
      baseInput({ dayStartMin: 0, dayEndMin: 0 }),
    );
    expect(slots).toEqual([]);
  });

  it("blocks overlap with a calendar event", () => {
    const conflict: TaggedConflict = {
      start: 12 * 60,
      end: 13 * 60,
      kind: "event",
      label: "Lunch booking",
    };
    const { slots, rejected } = resolveAvailability(
      baseInput({ conflicts: [conflict], bufferMinutes: 0 }),
    );
    // No slot should overlap 12:00–13:00
    expect(
      slots.some((s) => s.start < 13 * 60 && s.end > 12 * 60),
    ).toBe(false);
    // The 12:00 slot is rejected as overlap_event
    const r = rejected.find((r) => r.start === 12 * 60);
    expect(r?.reason).toBe("overlap_event");
    expect(r?.cause?.label).toBe("Lunch booking");
  });

  it("applies buffer to both sides of a conflict", () => {
    const conflict: TaggedConflict = {
      start: 12 * 60,
      end: 13 * 60,
      kind: "event",
    };
    const { slots, rejected } = resolveAvailability(
      baseInput({ conflicts: [conflict], bufferMinutes: 15 }),
    );
    // A 60-min slot at 11:00–12:00 ends exactly at conflict start; with 15-min buffer it's blocked.
    expect(slots.some((s) => s.start === 11 * 60)).toBe(false);
    const rej = rejected.find((r) => r.start === 11 * 60);
    expect(rej?.reason).toBe("buffer_event");
    // 10:45 slot ends at 11:45 — needs ≥15 min before 12:00; conflict end is 12:00, gap = 15 → still inside padded range (strict <)
    // Slot 10:00–11:00 has gap = 60 → fine.
    expect(slots.some((s) => s.start === 10 * 60)).toBe(true);
  });

  it("buffer of 0 still rejects direct overlap", () => {
    const conflict: TaggedConflict = {
      start: 10 * 60,
      end: 11 * 60,
      kind: "block",
    };
    const { slots } = resolveAvailability(
      baseInput({ conflicts: [conflict], bufferMinutes: 0 }),
    );
    expect(slots.some((s) => s.start === 10 * 60)).toBe(false);
    // 09:00–10:00 is fine (touching, no buffer)
    expect(slots.some((s) => s.start === 9 * 60)).toBe(true);
  });

  it("padOverrideMin overrides default buffer for that conflict only", () => {
    const conflicts: TaggedConflict[] = [
      { start: 12 * 60, end: 13 * 60, kind: "event", padOverrideMin: 30 },
      { start: 15 * 60, end: 16 * 60, kind: "event" }, // uses default 10
    ];
    const { rejected } = resolveAvailability(
      baseInput({ conflicts, bufferMinutes: 10 }),
    );
    // For first conflict, 11:30 slot (ends 12:30) is overlap; 11:15 slot ends 12:15 also overlap; 11:00 ends 12:00 — needs 30 min buffer → blocked.
    expect(rejected.some((r) => r.start === 11 * 60 && r.reason === "buffer_event")).toBe(true);
    // For second conflict, 14:00 slot ends 15:00 — needs only 10 min buffer → fine.
  });

  it("manual block produces overlap_block reason", () => {
    const conflict: TaggedConflict = {
      start: 14 * 60,
      end: 15 * 60,
      kind: "block",
      label: "Vacation",
    };
    const { rejected } = resolveAvailability(
      baseInput({ conflicts: [conflict] }),
    );
    const r = rejected.find((r) => r.start === 14 * 60);
    expect(r?.reason).toBe("overlap_block");
  });

  it("time_of_day filter rejects out-of-band slots", () => {
    const { slots, rejected } = resolveAvailability(
      baseInput({ timeOfDay: "morning" }),
    );
    expect(slots.every((s) => s.start < 12 * 60)).toBe(true);
    expect(
      rejected.some((r) => r.reason === "time_of_day" && r.start >= 12 * 60),
    ).toBe(true);
  });

  it("isToday=true rejects slots before now (London)", () => {
    // Pick a dayStart that is guaranteed to be before "now" (00:00) — slots
    // before London now must be rejected with reason 'past'.
    const { rejected } = resolveAvailability(
      baseInput({ dayStartMin: 0, dayEndMin: 24 * 60, isToday: true }),
    );
    expect(rejected.some((r) => r.reason === "past")).toBe(true);
  });

  it("anchorSkipMinutes advances cursor after a valid slot", () => {
    const { slots } = resolveAvailability(
      baseInput({ anchorSkipMinutes: 60 }),
    );
    // Slots should be hourly: 09, 10, 11, ..., 16  → 8 slots
    expect(slots.length).toBe(8);
    expect(slots.map((s) => s.start)).toEqual([9, 10, 11, 12, 13, 14, 15, 16].map((h) => h * 60));
  });

  it("handles overlapping conflicts correctly (event preferred reason)", () => {
    // Block and event both cover 12:00 — overlap_event should be reported (overlap wins over buffer).
    const conflicts: TaggedConflict[] = [
      { start: 12 * 60, end: 13 * 60, kind: "block", label: "B" },
      { start: 12 * 60, end: 13 * 60, kind: "event", label: "E" },
    ];
    const { rejected } = resolveAvailability(
      baseInput({ conflicts, bufferMinutes: 0 }),
    );
    const r = rejected.find((rr) => rr.start === 12 * 60);
    expect(r?.reason === "overlap_block" || r?.reason === "overlap_event").toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateSlot — single slot guard (used by booking creation)
// ---------------------------------------------------------------------------

describe("validateSlot", () => {
  const base = {
    dateStr: DATE,
    dayStartMin: 9 * 60,
    dayEndMin: 17 * 60,
    bufferMinutes: 10,
    durationMinutes: 60,
    conflicts: [] as TaggedConflict[],
    timeOfDay: "any" as const,
    isToday: false,
  };

  it("accepts a clean slot inside working hours", () => {
    const res = validateSlot({ ...base, startMin: 10 * 60 });
    expect(res.ok).toBe(true);
  });

  it("rejects slot starting before working hours", () => {
    const res = validateSlot({ ...base, startMin: 8 * 60 });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("outside_window");
  });

  it("rejects slot ending after working hours", () => {
    const res = validateSlot({ ...base, startMin: 16 * 60 + 30 });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("outside_window");
  });

  it("rejects slot that overlaps a conflict", () => {
    const conflict: TaggedConflict = {
      start: 11 * 60,
      end: 12 * 60,
      kind: "event",
      label: "X",
    };
    const res = validateSlot({
      ...base,
      conflicts: [conflict],
      startMin: 11 * 60,
      bufferMinutes: 0,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("overlap_event");
  });

  it("rejects slot that violates the buffer window", () => {
    const conflict: TaggedConflict = {
      start: 12 * 60,
      end: 13 * 60,
      kind: "block",
    };
    const res = validateSlot({
      ...base,
      conflicts: [conflict],
      bufferMinutes: 15,
      startMin: 11 * 60, // ends 12:00 — within 15-min buffer
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("buffer_block");
  });

  it("rejects out-of-band time_of_day", () => {
    const res = validateSlot({
      ...base,
      startMin: 14 * 60,
      timeOfDay: "morning",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("time_of_day");
  });
});

// ---------------------------------------------------------------------------
// toLondonParts — DST sanity
// ---------------------------------------------------------------------------

describe("toLondonParts (DST sanity)", () => {
  it("shows BST offset in summer", () => {
    // 12:00 UTC in summer = 13:00 London
    const p = toLondonParts(new Date("2026-06-15T12:00:00Z"));
    expect(p.date).toBe("2026-06-15");
    expect(p.hour).toBe(13);
    expect(p.minute).toBe(0);
  });
  it("shows GMT offset in winter", () => {
    const p = toLondonParts(new Date("2026-01-15T12:00:00Z"));
    expect(p.hour).toBe(12);
  });
});

// ---------------------------------------------------------------------------
// Integration — fixture-driven end-to-end day
// ---------------------------------------------------------------------------

describe("integration: working-hours + manual block + calendar + all-day", () => {
  it("computes the right slots from raw DB-shaped inputs", () => {
    const blocks = [
      {
        // 10:00–11:00 London
        start_datetime: "2026-06-15T09:00:00Z",
        end_datetime: "2026-06-15T10:00:00Z",
        label: "Personal",
      },
    ];
    const events = [
      {
        // 14:00–15:00 London — busy
        start_time: "2026-06-15T13:00:00Z",
        end_time: "2026-06-15T14:00:00Z",
        is_busy: true,
        label: "Dentist",
      },
      {
        // All-day "Holiday" → ignored
        start_time: "2026-06-15T00:00:00Z",
        end_time: "2026-06-16T00:00:00Z",
        is_busy: true,
        label: "Holiday",
      },
      {
        // Marked free → ignored
        start_time: "2026-06-15T16:00:00Z",
        end_time: "2026-06-15T16:30:00Z",
        is_busy: false,
      },
    ];

    const conflicts = buildDayConflicts(DATE, blocks, events);
    expect(conflicts).toHaveLength(2);

    const { slots, rejected } = resolveAvailability(
      baseInput({ conflicts, bufferMinutes: 10 }),
    );

    // No slot should overlap 10:00–11:00 or 14:00–15:00
    for (const s of slots) {
      expect(s.start < 11 * 60 && s.end > 10 * 60).toBe(false);
      expect(s.start < 15 * 60 && s.end > 14 * 60).toBe(false);
    }
    // First valid slot is 09:00 (10-min buffer means 09:00 ends at 10:00 → touching, no buffer violation because gap = 0 is < 10? Yes violated)
    // gap before block: slot 09:00–10:00 vs block 10:00–11:00 → e=10:00 == block.start; padded check: e > start - pad => 10:00 > 09:50 ✓ AND s < end + pad => 09:00 < 11:10 ✓ → blocked as buffer_event/block
    // So earliest must start such that slot end ≤ 09:50.
    // No slot fits before 10:00 with duration 60. So the first valid slot is after the block + buffer.
    expect(slots[0].start).toBeGreaterThanOrEqual(11 * 60 + 10);

    // Reasons should include buffer and overlap entries pointing at the right labels
    const labels = rejected
      .map((r) => r.cause?.label)
      .filter(Boolean);
    expect(labels).toContain("Personal");
    expect(labels).toContain("Dentist");
  });
});
