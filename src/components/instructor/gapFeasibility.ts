// Pure helpers for gap-candidate feasibility.
// Extracted from GapFillCard so the rules (buffer + travel time) can be unit tested.

export const TRAVEL_FALLBACK_MIN = 10;
export const MIN_LESSON_MIN = 60;

export interface FeasibilityInput {
  gapMin: number;
  bufferMinutes: number;
  travelOutMin: number | null; // prev drop-off → pupil pickup
  travelInMin: number | null; // pupil pickup → next pickup
}

export interface FeasibilityResult {
  fits: boolean;
  needed: number; // total minutes the pupil would consume in the gap
  slack: number; // gapMin - needed (negative when short)
  travelOutUsed: number;
  travelInUsed: number;
  travelOutEstimated: boolean;
  travelInEstimated: boolean;
}

/**
 * Determines whether a pupil fits inside a gap once the instructor's buffer
 * (applied at both ends) and per-pupil travel time are subtracted.
 *
 * Rule:  buffer + travelOut + MIN_LESSON_MIN + travelIn + buffer  <=  gapMin
 */
export function evaluateFeasibility({
  gapMin,
  bufferMinutes,
  travelOutMin,
  travelInMin,
}: FeasibilityInput): FeasibilityResult {
  const travelOutEstimated = travelOutMin === null;
  const travelInEstimated = travelInMin === null;
  const travelOutUsed = travelOutMin ?? TRAVEL_FALLBACK_MIN;
  const travelInUsed = travelInMin ?? TRAVEL_FALLBACK_MIN;
  const needed =
    bufferMinutes + travelOutUsed + MIN_LESSON_MIN + travelInUsed + bufferMinutes;
  return {
    fits: gapMin >= needed,
    needed,
    slack: gapMin - needed,
    travelOutUsed,
    travelInUsed,
    travelOutEstimated,
    travelInEstimated,
  };
}

export interface RankableCandidate {
  id: string;
  name: string;
  score: number;
  travelOutMin: number | null;
  travelInMin: number | null;
}

/**
 * Splits candidates into included / excluded based on feasibility, then
 * sorts each list using the same rules as the production hook.
 */
export function partitionAndRankCandidates<T extends RankableCandidate>(
  candidates: T[],
  gapMin: number,
  bufferMinutes: number,
): { included: T[]; excluded: T[] } {
  const included: T[] = [];
  const excluded: T[] = [];
  for (const c of candidates) {
    const { fits } = evaluateFeasibility({
      gapMin,
      bufferMinutes,
      travelOutMin: c.travelOutMin,
      travelInMin: c.travelInMin,
    });
    (fits ? included : excluded).push(c);
  }

  included.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const at = (a.travelOutMin ?? TRAVEL_FALLBACK_MIN) + (a.travelInMin ?? TRAVEL_FALLBACK_MIN);
    const bt = (b.travelOutMin ?? TRAVEL_FALLBACK_MIN) + (b.travelInMin ?? TRAVEL_FALLBACK_MIN);
    if (at !== bt) return at - bt;
    return a.name.localeCompare(b.name);
  });

  excluded.sort((a, b) => {
    const aOut = a.travelOutMin ?? TRAVEL_FALLBACK_MIN;
    const aIn = a.travelInMin ?? TRAVEL_FALLBACK_MIN;
    const bOut = b.travelOutMin ?? TRAVEL_FALLBACK_MIN;
    const bIn = b.travelInMin ?? TRAVEL_FALLBACK_MIN;
    const aNeeded = bufferMinutes + aOut + MIN_LESSON_MIN + aIn + bufferMinutes;
    const bNeeded = bufferMinutes + bOut + MIN_LESSON_MIN + bIn + bufferMinutes;
    if (aNeeded !== bNeeded) return aNeeded - bNeeded;
    return a.name.localeCompare(b.name);
  });

  return { included, excluded };
}
