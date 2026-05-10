export interface PostcodeRateRule {
  outward_code: string;
  hourly_rate: number;
}

/**
 * Extract the outward (first part) of a UK postcode.
 * "SO22 5DR" -> "SO22"; "po15" -> "PO15"; returns null if invalid.
 */
export function extractOutwardCode(postcode: string | null | undefined): string | null {
  if (!postcode) return null;
  const cleaned = postcode.replace(/\s+/g, "").toUpperCase();
  // Outward = everything before the final 3 characters (inward = 1 digit + 2 letters)
  if (cleaned.length < 4) return null;
  const outward = cleaned.slice(0, cleaned.length - 3);
  if (!/^[A-Z]{1,2}[0-9][0-9A-Z]?$/.test(outward)) return null;
  return outward;
}

export function isValidOutwardCode(code: string): boolean {
  return /^[A-Z]{1,2}[0-9][0-9A-Z]?$/.test(code.replace(/\s+/g, "").toUpperCase());
}

/**
 * Resolve the effective hourly rate.
 * Priority: pupil custom rate -> matching postcode rule -> instructor default.
 */
export function resolveHourlyRate(args: {
  pupilCustomRate?: number | null;
  pupilPostcode?: string | null;
  instructorDefaultRate?: number | null;
  postcodeRules?: PostcodeRateRule[] | null;
}): number | null {
  const { pupilCustomRate, pupilPostcode, instructorDefaultRate, postcodeRules } = args;
  if (pupilCustomRate != null && pupilCustomRate > 0) return pupilCustomRate;
  const outward = extractOutwardCode(pupilPostcode);
  if (outward && postcodeRules?.length) {
    const match = postcodeRules.find(
      (r) => r.outward_code.toUpperCase() === outward,
    );
    if (match && match.hourly_rate > 0) return match.hourly_rate;
  }
  return instructorDefaultRate ?? null;
}

/**
 * Compute the £ amount for a single lesson, honoring (in order):
 *   1. lesson.amount_due if explicitly set (>0)
 *   2. pupil custom rate (per-duration if available, else hourly * hours)
 *   3. matching postcode override
 *   4. instructor default
 */
export function computeLessonAmount(args: {
  durationMinutes: number;
  amountDue?: number | null;
  pupilCustomRate?: number | null;
  pupilCustomRate90?: number | null;
  pupilCustomRate120?: number | null;
  pupilPostcode?: string | null;
  lessonPostcode?: string | null;
  instructorDefaultRate?: number | null;
  postcodeRules?: PostcodeRateRule[] | null;
}): number {
  const {
    durationMinutes,
    amountDue,
    pupilCustomRate,
    pupilCustomRate90,
    pupilCustomRate120,
    pupilPostcode,
    lessonPostcode,
    instructorDefaultRate,
    postcodeRules,
  } = args;

  if (amountDue != null && Number(amountDue) > 0) return Number(amountDue);

  const hours = (durationMinutes || 0) / 60;
  const dur = durationMinutes || 0;

  // Per-duration custom rate has priority for matching durations.
  if (dur === 90 && pupilCustomRate90 != null && pupilCustomRate90 > 0) {
    return pupilCustomRate90;
  }
  if (dur === 120 && pupilCustomRate120 != null && pupilCustomRate120 > 0) {
    return pupilCustomRate120;
  }

  const rate = resolveHourlyRate({
    pupilCustomRate,
    pupilPostcode: lessonPostcode || pupilPostcode,
    instructorDefaultRate,
    postcodeRules,
  });

  return Math.round(hours * (rate ?? 0) * 100) / 100;
}

