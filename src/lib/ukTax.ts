/**
 * UK Income Tax + Class 2/4 NI helpers for self-employed instructors.
 *
 * Pure functions used by the instructor tax dashboard tile and the full
 * /instructor/tax page. Bands and rates match HMRC 2025/26.
 */

export const HMRC_MILEAGE_FIRST_10K = 0.45;
export const HMRC_MILEAGE_AFTER_10K = 0.25;
export const KM_TO_MILES = 0.621371;

const PERSONAL_ALLOWANCE = 12_570;
const PA_TAPER_THRESHOLD = 100_000;
const BASIC_BAND_TOP = 50_270;
const HIGHER_BAND_TOP = 125_140;

const BASIC_RATE = 0.20;
const HIGHER_RATE = 0.40;
const ADDITIONAL_RATE = 0.45;

const CLASS4_LOWER = 12_570;
const CLASS4_UPPER = 50_270;
const CLASS4_MAIN_RATE = 0.06;
const CLASS4_ADDITIONAL_RATE = 0.02;

/** Class 2 NI: £3.45/week × 52 weeks. Payable when profits exceed the Small Profits Threshold (£12,570). */
const CLASS2_WEEKLY = 3.45;
const CLASS2_ANNUAL = CLASS2_WEEKLY * 52; // £179.40
const CLASS2_SMALL_PROFITS_THRESHOLD = 12_570;

/**
 * UK Income Tax — applies the personal-allowance taper above £100,000
 * (allowance reduces by £1 for every £2 of taxable income over £100k,
 * reaching £0 at £125,140).
 */
export function calculateTax(taxable: number): number {
  if (taxable <= 0) return 0;

  // Personal allowance taper (D1)
  const taperExcess = Math.max(0, taxable - PA_TAPER_THRESHOLD);
  const adjustedPA = Math.max(0, PERSONAL_ALLOWANCE - Math.floor(taperExcess / 2));

  if (taxable <= adjustedPA) return 0;

  let tax = 0;
  const basicPortion = Math.min(taxable, BASIC_BAND_TOP) - adjustedPA;
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

export interface NIBreakdown {
  class2: number;
  class4: number;
  total: number;
}

/**
 * Self-employed National Insurance: Class 2 (flat £179.40 above the Small
 * Profits Threshold) plus Class 4 (6% main band, 2% above £50,270).
 */
export function calculateNI(taxable: number): NIBreakdown {
  if (taxable <= CLASS4_LOWER) {
    return { class2: 0, class4: 0, total: 0 };
  }

  let class4 = 0;
  const mainPortion = Math.min(taxable, CLASS4_UPPER) - CLASS4_LOWER;
  if (mainPortion > 0) class4 += mainPortion * CLASS4_MAIN_RATE;
  if (taxable > CLASS4_UPPER) {
    class4 += (taxable - CLASS4_UPPER) * CLASS4_ADDITIONAL_RATE;
  }

  const class2 = taxable > CLASS2_SMALL_PROFITS_THRESHOLD ? CLASS2_ANNUAL : 0;

  return { class2, class4, total: class2 + class4 };
}

export function calculateHmrcMileageDeduction(businessMiles: number): number {
  if (businessMiles <= 0) return 0;
  if (businessMiles <= 10_000) return businessMiles * HMRC_MILEAGE_FIRST_10K;
  return 10_000 * HMRC_MILEAGE_FIRST_10K + (businessMiles - 10_000) * HMRC_MILEAGE_AFTER_10K;
}

/**
 * UK tax year boundaries (6 April → 5 April). Anchored to Europe/London
 * (BST, +01:00) to avoid roll-over errors around the 5/6 April boundary
 * when the runtime clock is not in UK local time.
 */
export function currentUkTaxYear(now: Date = new Date()): {
  startISO: string;
  endISO: string;
  label: string;
  monthsRemaining: number;
} {
  const year = now.getUTCFullYear();
  // April 6 in the UK is always BST (+01:00). Compare the instant against
  // the explicit London-clock cutover to decide which tax year we're in.
  const cutoverThisYear = new Date(`${year}-04-06T00:00:00+01:00`);
  const startYear = now.getTime() >= cutoverThisYear.getTime() ? year : year - 1;
  const startISO = `${startYear}-04-06`;
  const endISO = `${startYear + 1}-04-05`;
  const label = `20${String(startYear).slice(-2)}/${String(startYear + 1).slice(-2)}`;
  // Months remaining (floored) from `now` until the next 6 April cutover.
  const nextCutover = new Date(`${startYear + 1}-04-06T00:00:00+01:00`);
  const diffMs = nextCutover.getTime() - now.getTime();
  const monthsRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375)));
  return { startISO, endISO, label, monthsRemaining };
}
