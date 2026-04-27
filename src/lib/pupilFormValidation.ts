/**
 * Display + persistence formatting and soft-validation utilities for
 * the Edit Pupil form. Pure functions — safe to reuse anywhere.
 */

/** Normalise UK postcode: uppercase, single internal space between outward+inward codes. */
export function formatPostcode(raw: string | null | undefined): string {
  if (!raw) return "";
  const cleaned = String(raw).replace(/\s+/g, "").toUpperCase();
  if (!cleaned) return "";
  // UK postcode pattern: 2-4 char outward + 3 char inward
  const m = cleaned.match(/^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/);
  if (m) return `${m[1]} ${m[2]}`;
  return cleaned;
}

/** Returns true if string looks like a valid UK postcode (after normalisation). */
export function isValidUkPostcode(raw: string | null | undefined): boolean {
  if (!raw) return true; // empty is allowed
  const cleaned = String(raw).replace(/\s+/g, "").toUpperCase();
  return /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(cleaned);
}

/** Basic email shape check — something@something.something */
export function isValidEmailShape(raw: string | null | undefined): boolean {
  if (!raw) return true; // empty allowed
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(raw).trim());
}

/** UK / international phone shape check (loose). */
export function isValidPhoneShape(raw: string | null | undefined): boolean {
  if (!raw) return true; // empty allowed
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return false;
  // UK landline / mobile or international starting with country code
  return /^(0\d{9,10}|44\d{9,10}|\d{7,15})$/.test(digits);
}

export interface NameWarning {
  code: "too-short" | "no-vowels" | null;
  message: string | null;
}

/** Soft validation for names. Returns null code if name passes. */
export function checkName(raw: string | null | undefined): NameWarning {
  const trimmed = (raw || "").trim();
  if (trimmed.length === 0) return { code: null, message: null };
  if (trimmed.length < 2) {
    return {
      code: "too-short",
      message: "This doesn't look like a typical name — save anyway?",
    };
  }
  // 4+ consonants in a row, no vowel anywhere
  const lower = trimmed.toLowerCase().replace(/[^a-z]/g, "");
  if (lower.length >= 4 && !/[aeiouy]/.test(lower)) {
    return {
      code: "no-vowels",
      message: "This doesn't look like a typical name — save anyway?",
    };
  }
  return { code: null, message: null };
}
