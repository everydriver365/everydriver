// Compatibility scoring for job offers vs the signed-in instructor's
// service area (postcode + radius) and weekly working hours.
//
// Returns a level (great / good / poor) plus a short label and a
// breakdown of why, for use in JobOfferCard and JobOfferDetailSheet.

export type CompatibilityLevel = "great" | "good" | "poor" | "unknown";

export interface WorkingHourRow {
  day_of_week: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  start_time: string;  // "HH:MM:SS"
  end_time: string;    // "HH:MM:SS"
  is_active: boolean;
}

export interface CompatibilityInput {
  distanceMi: number | null | undefined;
  radiusMi: number | null | undefined;
  preferredTiming: string | null | undefined;
  workingHours: WorkingHourRow[] | null | undefined;
}

export interface CompatibilityResult {
  level: CompatibilityLevel;
  label: string;                // "Great match" / "Good match" / "Poor match"
  score: number;                // 0-100
  distanceFit: "in" | "near" | "out" | "unknown";
  timingFit: "fits" | "partial" | "miss" | "neutral" | "unknown";
  reasons: string[];            // human readable breakdown
}

// Parse "HH:MM" or "HH:MM:SS" to minutes from midnight.
function timeToMins(t: string | null | undefined): number | null {
  if (!t) return null;
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

interface TimingRequirement {
  // Required overlap window in minutes from midnight (inclusive start, exclusive end).
  windowStart?: number;
  windowEnd?: number;
  // Allowed weekdays (0=Sun ... 6=Sat). undefined = any.
  days?: number[];
  // Human label for "needs ..." text.
  needs?: string;
  // If true, no time/day filter — neutral (start-when timing only).
  neutral?: boolean;
}

const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKEND = [0, 6];

function parseTiming(raw: string | null | undefined): TimingRequirement {
  if (!raw) return { neutral: true };
  const key = raw.trim().toLowerCase().replace(/[\s_]+/g, "-");

  switch (key) {
    case "weekdays-morning":
    case "weekday-mornings":
    case "weekday-morning":
      return { days: WEEKDAYS, windowStart: 8 * 60, windowEnd: 12 * 60, needs: "weekday mornings (8am–12pm)" };
    case "weekdays-afternoon":
    case "weekday-afternoons":
    case "weekday-afternoon":
      return { days: WEEKDAYS, windowStart: 12 * 60, windowEnd: 17 * 60, needs: "weekday afternoons (12pm–5pm)" };
    case "weekdays-evening":
    case "weekday-evenings":
    case "weekday-evening":
      return { days: WEEKDAYS, windowStart: 17 * 60, windowEnd: 21 * 60, needs: "weekday evenings (5pm–9pm)" };
    case "weekends":
    case "weekend":
    case "weekends-only":
      return { days: WEEKEND, windowStart: 9 * 60, windowEnd: 18 * 60, needs: "weekends" };
    case "asap":
    case "urgent":
    case "this-week":
    case "next-week":
    case "this-month":
    case "next-month":
    case "flexible":
      return { neutral: true };
  }
  // Date-only timings are neutral for fit purposes.
  return { neutral: true };
}

// Computes how many of the requested days/windows the instructor's working
// hours actually cover. Returns a fraction 0..1.
function timingCoverage(
  req: TimingRequirement,
  workingHours: WorkingHourRow[],
): { fraction: number; matchedDays: number; totalDays: number } {
  if (req.neutral || !req.days || req.days.length === 0) {
    return { fraction: 1, matchedDays: 0, totalDays: 0 };
  }
  const active = workingHours.filter((w) => w.is_active);
  let matched = 0;
  for (const d of req.days) {
    const day = active.find((w) => w.day_of_week === d);
    if (!day) continue;
    if (req.windowStart == null || req.windowEnd == null) {
      matched += 1;
      continue;
    }
    const startMin = timeToMins(day.start_time);
    const endMin = timeToMins(day.end_time);
    if (startMin == null || endMin == null) continue;
    // Treat as overlap >= 60 mins to count as a fit.
    const overlap = Math.max(0, Math.min(endMin, req.windowEnd) - Math.max(startMin, req.windowStart));
    if (overlap >= 60) matched += 1;
  }
  return { fraction: matched / req.days.length, matchedDays: matched, totalDays: req.days.length };
}

export function computeJobCompatibility(input: CompatibilityInput): CompatibilityResult {
  const { distanceMi, radiusMi, preferredTiming, workingHours } = input;
  const reasons: string[] = [];

  // ---- Distance ----
  let distanceFit: CompatibilityResult["distanceFit"] = "unknown";
  let distanceScore = 0; // out of 60
  if (distanceMi != null && Number.isFinite(distanceMi) && radiusMi != null && radiusMi > 0) {
    if (distanceMi <= radiusMi) {
      distanceFit = "in";
      // Closer than half the radius gets full marks; out to the edge tapers down.
      const closeness = 1 - Math.max(0, distanceMi / radiusMi - 0.5) / 0.5;
      distanceScore = 40 + Math.round(20 * Math.max(0, Math.min(1, closeness)));
      reasons.push(`${distanceMi.toFixed(1)} mi — inside your ${radiusMi} mi radius`);
    } else if (distanceMi <= radiusMi * 1.25) {
      distanceFit = "near";
      distanceScore = 25;
      reasons.push(`${distanceMi.toFixed(1)} mi — just outside your ${radiusMi} mi radius`);
    } else {
      distanceFit = "out";
      distanceScore = 0;
      reasons.push(`${distanceMi.toFixed(1)} mi — beyond your ${radiusMi} mi radius`);
    }
  } else if (distanceMi != null) {
    // Distance known but no radius configured — give a partial weighting.
    distanceFit = "unknown";
    distanceScore = 30;
    reasons.push(`${distanceMi.toFixed(1)} mi away (no radius set)`);
  } else {
    distanceFit = "unknown";
    distanceScore = 0;
    reasons.push("Distance unknown");
  }

  // ---- Timing vs working hours ----
  const req = parseTiming(preferredTiming);
  const hours = workingHours ?? [];
  let timingFit: CompatibilityResult["timingFit"] = "unknown";
  let timingScore = 0; // out of 40

  if (hours.length === 0) {
    timingFit = "unknown";
    timingScore = req.neutral ? 30 : 15;
    reasons.push(req.neutral
      ? "Pupil is flexible on start"
      : "Set your working hours to check timing fit");
  } else if (req.neutral) {
    timingFit = "neutral";
    timingScore = 35;
    reasons.push("Pupil is flexible on start");
  } else {
    const { fraction, matchedDays, totalDays } = timingCoverage(req, hours);
    if (fraction >= 0.8) {
      timingFit = "fits";
      timingScore = 40;
      reasons.push(`Your hours cover ${req.needs}`);
    } else if (fraction >= 0.4) {
      timingFit = "partial";
      timingScore = 22;
      reasons.push(`You cover ${matchedDays}/${totalDays} of ${req.needs}`);
    } else {
      timingFit = "miss";
      timingScore = 5;
      reasons.push(`Your hours don't cover ${req.needs}`);
    }
  }

  const score = distanceScore + timingScore;

  let level: CompatibilityLevel;
  let label: string;
  if (distanceFit === "out" && timingFit === "miss") {
    level = "poor";
    label = "Poor match";
  } else if (score >= 75) {
    level = "great";
    label = "Great match";
  } else if (score >= 50) {
    level = "good";
    label = "Good match";
  } else if (distanceFit === "unknown" && timingFit === "unknown") {
    level = "unknown";
    label = "Not enough info";
  } else {
    level = "poor";
    label = "Poor match";
  }

  return { level, label, score, distanceFit, timingFit, reasons };
}

export function compatibilityColors(level: CompatibilityLevel): { bg: string; fg: string } {
  switch (level) {
    case "great":
      return { bg: "#E8F3E8", fg: "#2F7A2F" };
    case "good":
      return { bg: "#FEF4E0", fg: "#A66A00" };
    case "poor":
      return { bg: "#FBEAEC", fg: "#C8434F" };
    default:
      return { bg: "#F2F2F4", fg: "#6E6E73" };
  }
}
