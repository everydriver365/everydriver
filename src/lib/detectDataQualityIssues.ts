import { canonicalPhone } from "./formatPhoneNumber";

export type DataQualityIssue =
  | "invalid-name"
  | "invalid-phone"
  | "duplicate-phone";

export interface PupilLike {
  id: string;
  name: string | null;
  phone: string | null;
}

const VOWELS = /[aeiouy]/i;

function nameLooksInvalid(rawName: string | null | undefined): boolean {
  const name = (rawName || "").trim();
  if (name.length < 3) return true;
  if (!VOWELS.test(name)) return true;
  // 4+ consonants in a row (treating spaces/punctuation as breaks)
  if (/[bcdfghjklmnpqrstvwxz]{4,}/i.test(name.replace(/\s+/g, ""))) return true;
  // <3 unique letters in a 4+ char name
  if (name.length >= 4) {
    const unique = new Set(name.toLowerCase().replace(/[^a-z]/g, ""));
    if (unique.size < 3) return true;
  }
  return false;
}

function phoneLooksInvalid(rawPhone: string | null | undefined): boolean {
  if (!rawPhone) return false; // missing phone is not flagged here
  const digits = String(rawPhone).replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return true;
  // UK numbers should be 10 (without leading 0) or 11 (with) or 12 (with 44)
  // Accept generic international too (7-15 digits, E.164-ish)
  return false;
}

/**
 * Detects rendering-time data-quality issues. Pure, non-destructive.
 * Pass the full pupil list so duplicate-phone detection works.
 */
export function detectDataQualityIssues(
  pupil: PupilLike,
  allPupils: PupilLike[] = [],
): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];

  if (nameLooksInvalid(pupil.name)) issues.push("invalid-name");
  if (phoneLooksInvalid(pupil.phone)) issues.push("invalid-phone");

  if (pupil.phone) {
    const me = canonicalPhone(pupil.phone);
    if (me) {
      const dup = allPupils.some(
        (p) => p.id !== pupil.id && canonicalPhone(p.phone) === me,
      );
      if (dup) issues.push("duplicate-phone");
    }
  }

  return issues;
}

/**
 * Find the name of the first other pupil that shares this phone, or null.
 */
export function findPhoneDuplicateName(
  pupil: PupilLike,
  allPupils: PupilLike[],
): string | null {
  if (!pupil.phone) return null;
  const me = canonicalPhone(pupil.phone);
  if (!me) return null;
  const other = allPupils.find(
    (p) => p.id !== pupil.id && canonicalPhone(p.phone) === me,
  );
  return other?.name?.trim() || null;
}
