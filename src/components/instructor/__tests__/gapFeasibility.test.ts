import { describe, it, expect } from "vitest";
import {
  evaluateFeasibility,
  partitionAndRankCandidates,
  MIN_LESSON_MIN,
  TRAVEL_FALLBACK_MIN,
  type RankableCandidate,
} from "../gapFeasibility";

describe("evaluateFeasibility", () => {
  it("includes a pupil when buffer + real travel + lesson fits the gap", () => {
    // 10m buffer * 2 + 5m + 60m + 5m = 90m  <= 120m gap
    const r = evaluateFeasibility({
      gapMin: 120,
      bufferMinutes: 10,
      travelOutMin: 5,
      travelInMin: 5,
    });
    expect(r.fits).toBe(true);
    expect(r.needed).toBe(90);
    expect(r.slack).toBe(30);
  });

  it("excludes a pupil when buffer + travel pushes over the gap", () => {
    // 10*2 + 20 + 60 + 20 = 120 > 110
    const r = evaluateFeasibility({
      gapMin: 110,
      bufferMinutes: 10,
      travelOutMin: 20,
      travelInMin: 20,
    });
    expect(r.fits).toBe(false);
    expect(r.needed).toBe(120);
    expect(r.slack).toBe(-10);
  });

  it("falls back to the 10m default when travel time is unknown", () => {
    const r = evaluateFeasibility({
      gapMin: 95,
      bufferMinutes: 5,
      travelOutMin: null,
      travelInMin: null,
    });
    expect(r.travelOutUsed).toBe(TRAVEL_FALLBACK_MIN);
    expect(r.travelInUsed).toBe(TRAVEL_FALLBACK_MIN);
    expect(r.travelOutEstimated).toBe(true);
    expect(r.travelInEstimated).toBe(true);
    // 5 + 10 + 60 + 10 + 5 = 90, fits 95
    expect(r.fits).toBe(true);
  });

  it("treats the boundary (needed === gap) as fitting", () => {
    const r = evaluateFeasibility({
      gapMin: MIN_LESSON_MIN, // 60m gap, 0 buffer, 0 travel
      bufferMinutes: 0,
      travelOutMin: 0,
      travelInMin: 0,
    });
    expect(r.fits).toBe(true);
    expect(r.slack).toBe(0);
  });

  it("excludes when buffer alone consumes too much of the gap", () => {
    // 30m buffer each side eats 60m → only 60m left, but lesson + travel need more
    const r = evaluateFeasibility({
      gapMin: 90,
      bufferMinutes: 30,
      travelOutMin: 0,
      travelInMin: 0,
    });
    // 30 + 0 + 60 + 0 + 30 = 120 > 90
    expect(r.fits).toBe(false);
  });
});

describe("partitionAndRankCandidates", () => {
  const mk = (
    id: string,
    name: string,
    score: number,
    travelOutMin: number | null,
    travelInMin: number | null,
  ): RankableCandidate => ({ id, name, score, travelOutMin, travelInMin });

  it("excludes pupils whose buffer + travel + lesson exceeds the gap", () => {
    const candidates = [
      mk("a", "Alice", 0, 5, 5), // 90 fits in 100
      mk("b", "Bob", 0, 30, 30), // 140 > 100
      mk("c", "Cara", 0, null, null), // 90 fits in 100 (fallback)
    ];
    const { included, excluded } = partitionAndRankCandidates(candidates, 100, 10);
    expect(included.map((p) => p.id).sort()).toEqual(["a", "c"]);
    expect(excluded.map((p) => p.id)).toEqual(["b"]);
  });

  it("ranks included pupils by score, then shortest combined travel, then name", () => {
    const candidates = [
      mk("low-score-fast", "Zed", 0, 1, 1),
      mk("high-score", "Mia", 5, 20, 20),
      mk("mid-score-fast", "Ada", 2, 1, 1),
      mk("mid-score-slow", "Bea", 2, 10, 10),
    ];
    // gap 200, buffer 0 → all fit
    const { included } = partitionAndRankCandidates(candidates, 200, 0);
    expect(included.map((p) => p.id)).toEqual([
      "high-score",
      "mid-score-fast",
      "mid-score-slow",
      "low-score-fast",
    ]);
  });

  it("orders excluded pupils by smallest shortfall first", () => {
    const candidates = [
      mk("very-far", "Far", 0, 60, 60), // needed 120, short 70 (gap 50)
      mk("just-short", "Just", 0, 0, 0), // needed 60, short 10
      mk("middling", "Mid", 0, 10, 10), // needed 80, short 30
    ];
    const { included, excluded } = partitionAndRankCandidates(candidates, 50, 0);
    expect(included).toHaveLength(0);
    expect(excluded.map((p) => p.id)).toEqual(["just-short", "middling", "very-far"]);
  });

  it("respects instructor buffer when deciding inclusion", () => {
    // Same gap, same travel — only the buffer changes.
    const candidate = mk("p1", "Pat", 0, 5, 5);
    // needed with buffer 0  = 70, fits in 80
    expect(partitionAndRankCandidates([candidate], 80, 0).included).toHaveLength(1);
    // needed with buffer 10 = 90, no longer fits
    const r = partitionAndRankCandidates([candidate], 80, 10);
    expect(r.included).toHaveLength(0);
    expect(r.excluded).toHaveLength(1);
  });
});
