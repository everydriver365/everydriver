/**
 * Shared validators for user-facing forms.
 *
 * Pure functions — return `null` if value is valid, otherwise return a short
 * human-readable error message that can be displayed inline beneath a field.
 *
 * Keep these UK-centric (postcode, mobile) and aligned with the project memory
 * (e.g. £0.50 minimum on payments, no negative amounts).
 *
 * Usage:
 *   const err = validateEmail(form.email);
 *   if (err) setErrors((e) => ({ ...e, email: err }));
 */

/* ---------- regex patterns (exported for reuse where needed) ----------- */

// UK postcode — full or partial outward code; allows extra whitespace.
// Examples: SW1A 1AA, sw1a1aa, M1 1AE, EC1A 1BB, GIR 0AA, SO23, PO15.
export const UK_POSTCODE_REGEX =
  /^(GIR\s?0AA|[A-PR-UWYZ]([0-9]{1,2}|([A-HK-Y][0-9]([0-9]|[ABEHMNPRV-Y])?)|[0-9][A-HJKPS-UW])\s?[0-9][ABD-HJLNP-UW-Z]{2}|[A-PR-UWYZ]([0-9]{1,2}|([A-HK-Y][0-9]([0-9]|[ABEHMNPRV-Y])?)|[0-9][A-HJKPS-UW]))$/i;

// UK mobile: 07xxxxxxxxx (11 digits) or +447xxxxxxxxx / 00447…
// Tolerates spaces, hyphens, brackets while validating digit count.
export const UK_MOBILE_REGEX = /^(?:\+?44|0)7\d{9}$/;

// RFC-5322 simplified — pragmatic, not strict.
export const EMAIL_REGEX =
  /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}$/i;

// Time slot HH:MM (00:00 – 23:59)
export const TIME_HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/* --------------------------- helpers ----------------------------------- */

function stripSpacesAndPunct(s: string): string {
  return s.replace(/[\s\-().]/g, "");
}

/* --------------------------- validators -------------------------------- */

export function validateRequired(value: string | null | undefined, fieldName = "This field"): string | null {
  if (value == null || String(value).trim() === "") return `${fieldName} is required`;
  return null;
}

export function validateEmail(value: string | null | undefined, opts: { required?: boolean } = {}): string | null {
  const v = (value ?? "").trim();
  if (!v) return opts.required ? "Email is required" : null;
  if (v.length > 254) return "Email is too long";
  if (!EMAIL_REGEX.test(v)) return "Enter a valid email address";
  return null;
}

export function validateUKMobile(value: string | null | undefined, opts: { required?: boolean } = {}): string | null {
  const v = stripSpacesAndPunct((value ?? "").trim());
  if (!v) return opts.required ? "Phone number is required" : null;
  if (!UK_MOBILE_REGEX.test(v)) return "Enter a valid UK mobile (07… or +447…)";
  return null;
}

export function validateUKPostcode(value: string | null | undefined, opts: { required?: boolean } = {}): string | null {
  const v = (value ?? "").trim();
  if (!v) return opts.required ? "Postcode is required" : null;
  if (!UK_POSTCODE_REGEX.test(v)) return "Enter a valid UK postcode";
  return null;
}

/**
 * Positive currency amount in £. Max 2 decimal places. Optional min/max.
 * Defaults align with project memory: £0.50 minimum on payments.
 */
export function validateCurrency(
  value: string | number | null | undefined,
  opts: { required?: boolean; min?: number; max?: number; label?: string } = {}
): string | null {
  const label = opts.label ?? "Amount";
  if (value === null || value === undefined || value === "") {
    return opts.required ? `${label} is required` : null;
  }
  const str = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(str)) return `${label} must be a positive number with up to 2 decimals`;
  const num = Number(str);
  if (!Number.isFinite(num) || num <= 0) return `${label} must be greater than 0`;
  if (opts.min != null && num < opts.min) return `${label} must be at least £${opts.min.toFixed(2)}`;
  if (opts.max != null && num > opts.max) return `${label} cannot exceed £${opts.max.toFixed(2)}`;
  return null;
}

/**
 * Validates a date is not in the past (defaults to comparing day-only).
 * Accepts Date, ISO string, or yyyy-MM-dd string.
 */
export function validateNotInPast(
  value: Date | string | null | undefined,
  opts: { label?: string; allowToday?: boolean } = {}
): string | null {
  const label = opts.label ?? "Date";
  if (!value) return `${label} is required`;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return `${label} is invalid`;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compare = new Date(date);
  compare.setHours(0, 0, 0, 0);
  if (opts.allowToday !== false) {
    if (compare < today) return `${label} cannot be in the past`;
  } else {
    if (compare <= today) return `${label} must be in the future`;
  }
  return null;
}

export function validateTimeHHMM(value: string | null | undefined, opts: { required?: boolean } = {}): string | null {
  const v = (value ?? "").trim();
  if (!v) return opts.required ? "Time is required" : null;
  if (!TIME_HHMM_REGEX.test(v)) return "Enter time as HH:MM (e.g. 09:30)";
  return null;
}

/**
 * At-least-one-of validator. Useful for "phone OR email required".
 * Returns null if any of the values is non-empty, else the supplied message.
 */
export function validateAnyOf(
  values: Array<string | null | undefined>,
  message = "Please provide at least one contact method"
): string | null {
  return values.some((v) => (v ?? "").trim() !== "") ? null : message;
}

/* ---------------------- composite form helper -------------------------- */

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

/** Returns true if no field has an error. */
export function isFormValid<T extends string>(errors: FieldErrors<T>): boolean {
  return Object.values(errors).every((v) => !v);
}
