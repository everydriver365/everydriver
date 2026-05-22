/**
 * UK Income Tax + Class 2/4 NI helpers for self-employed instructors.
 *
 * Pure functions duplicated from the inline logic in InstructorTax.tsx so the
 * dashboard tile can share them without modifying that page. Bands match the
 * 2024/25 personal allowance / thresholds already used in InstructorTax.tsx.
 */

export const HMRC_MILEAGE_FIRST_10K = 0.45;
export const HMRC_MILEAGE_AFTER_10K = 0.25;
export const KM_TO_MILES = 0.621371;

const PERSONAL_ALLOWANCE = 12_570;
const BASIC_BAND_TOP = 50_270;
const HIGHER_BAND_TOP = 125_140;

const BASIC_RATE = 0.20;
const HIGHER_RATE = 0.40;
const ADDITIONAL_RATE = 0.45;

const CLASS4_LOWER = 12_570;
const CLASS4_UPPER = 50_270;
const CLASS4_MAIN_RATE = 0.06;
const CLASS4_ADDITIONAL_RATE = 0.02;

export function calculateTax(taxable: number): number {
  if (taxable <= PERSONAL_ALLOWANCE) return 0;
  let tax = 0;
  const basicPortion = Math.min(taxable, BASIC_BAND_TOP) - PERSONAL_ALLOWANCE;
  if (basicPortion > 0) tax += basicPortion * BASIC_RATE;
  if (taxable > BASIC_BAND_TOP) {
    const higherPortion = Math.min(taxable, HIGHER_BAND_TOP) - BASIC_BAND_TOP;
    if (higherPortion > 0) tax += higherPortion * HIGHER_RATE;
  }
  if (taxable > HIGHER_BAND_TOP) {
    tax += (taxable - HIGHER_BAND_TOP) * ADDITIONAL_RATE;
  }
  return tax;
}

export function calculateNI(taxable: number): number {
  if (taxable <= CLASS4_LOWER) return 0;
  let ni = 0;
  const mainPortion = Math.min(taxable, CLASS4_UPPER) - CLASS4_LOWER;
  if (mainPortion > 0) ni += mainPortion * CLASS4_MAIN_RATE;
  if (taxable > CLASS4_UPPER) {
    ni += (taxable - CLASS4_UPPER) * CLASS4_ADDITIONAL_RATE;
  }
  return ni;
}

export function calculateHmrcMileageDeduction(businessMiles: number): number {
  if (businessMiles <= 0) return 0;
  if (businessMiles <= 10_000) return businessMiles * HMRC_MILEAGE_FIRST_10K;
  return 10_000 * HMRC_MILEAGE_FIRST_10K + (businessMiles - 10_000) * HMRC_MILEAGE_AFTER_10K;
}

/** UK tax year boundaries (6 April → 5 April). */
export function currentUkTaxYear(now: Date = new Date()): {
  startISO: string;
  endISO: string;
  label: string;
  monthsRemaining: number;
} {
  const year = now.getFullYear();
  const cutover = new Date(year, 3, 6); // April 6 this calendar year
  const startYear = now >= cutover ? year : year - 1;
  const start = new Date(startYear, 3, 6);
  const end = new Date(startYear + 1, 3, 5);
  const startISO = `${startYear}-04-06`;
  const endISO = `${startYear + 1}-04-05`;
  const label = `${String(startYear).slice(-2)}/${String(startYear + 1).slice(-2)}`;
  // Months remaining (floored) from `now` until the 6 April cutover.
  const nextCutover = new Date(startYear + 1, 3, 6);
  const diffMs = nextCutover.getTime() - now.getTime();
  const monthsRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375)));
  return { startISO, endISO, label: `20${label}`, monthsRemaining };
}
