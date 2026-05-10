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
