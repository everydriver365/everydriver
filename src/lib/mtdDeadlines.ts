/**
 * UK Making Tax Digital (MTD ITSA) quarterly deadlines.
 * Pure utility — no Supabase, no React. Fully testable.
 *
 *   Q1: 6 Apr – 5 Jul  → file by 7 Aug
 *   Q2: 6 Jul – 5 Oct  → file by 7 Nov
 *   Q3: 6 Oct – 5 Jan  → file by 7 Feb (next calendar year)
 *   Q4: 6 Jan – 5 Apr  → file by 7 May (next calendar year)
 *
 * Tax year is identified by its start year (e.g. 2025 → 2025/26).
 */

export type QuarterNumber = 1 | 2 | 3 | 4;
export type Urgency = "urgent" | "warning" | "ok";

export interface QuarterDeadline {
  quarter: QuarterNumber;
  taxYear: number;
  periodStart: Date;
  periodEnd: Date;
  deadline: Date;
  /** e.g. "Q2 2025/26" */
  label: string;
}

export interface NextDeadline extends QuarterDeadline {
  daysRemaining: number;
  isOverdue: boolean;
  urgency: Urgency;
}

const MS_PER_DAY = 86_400_000;

/** Build a UTC midnight date — keeps day-math clean across DST. */
function utcDate(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

function startOfUtcDay(d: Date): Date {
  return utcDate(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Returns the start year of the UK tax year that contains `now`.
 * Tax year runs 6 Apr → 5 Apr. Dates on/after 6 Apr belong to that year.
 */
export function getCurrentTaxYear(now: Date = new Date()): number {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth(); // 0 = Jan
  const d = now.getUTCDate();
  // Before 6 April → previous tax year
  if (m < 3 || (m === 3 && d < 6)) return y - 1;
  return y;
}

const QUARTERS: ReadonlyArray<{
  q: QuarterNumber;
  startMonth: number; // 0-indexed
  startDay: number;
  endMonth: number;
  endDay: number;
  deadlineMonth: number;
  deadlineDay: number;
  /** +1 means deadline (and end) fall in the following calendar year. */
  endYearOffset: 0 | 1;
  deadlineYearOffset: 0 | 1;
}> = [
  { q: 1, startMonth: 3, startDay: 6, endMonth: 6, endDay: 5, deadlineMonth: 7, deadlineDay: 7, endYearOffset: 0, deadlineYearOffset: 0 }, // Apr→Jul, due Aug
  { q: 2, startMonth: 6, startDay: 6, endMonth: 9, endDay: 5, deadlineMonth: 10, deadlineDay: 7, endYearOffset: 0, deadlineYearOffset: 0 }, // Jul→Oct, due Nov
  { q: 3, startMonth: 9, startDay: 6, endMonth: 0, endDay: 5, deadlineMonth: 1, deadlineDay: 7, endYearOffset: 1, deadlineYearOffset: 1 }, // Oct→Jan, due Feb
  { q: 4, startMonth: 0, startDay: 6, endMonth: 3, endDay: 5, deadlineMonth: 4, deadlineDay: 7, endYearOffset: 1, deadlineYearOffset: 1 }, // Jan→Apr, due May
];

export function getQuarterDeadlines(taxYear: number): QuarterDeadline[] {
  return QUARTERS.map((spec) => {
    const startYear = taxYear + (spec.q >= 4 ? 1 : 0);
    return {
      quarter: spec.q,
      taxYear,
      periodStart: utcDate(taxYear + (spec.q === 4 ? 1 : 0), spec.startMonth, spec.startDay),
      periodEnd: utcDate(taxYear + spec.endYearOffset, spec.endMonth, spec.endDay),
      deadline: utcDate(taxYear + spec.deadlineYearOffset, spec.deadlineMonth, spec.deadlineDay),
      label: `Q${spec.q} ${taxYear}/${String((taxYear + 1) % 100).padStart(2, "0")}`,
    };
  });
}

/** Which quarter (1–4) does this date fall in? Dates outside any quarter snap to the next one. */
export function getQuarterForDate(date: Date): QuarterNumber {
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  // Q1: 6 Apr (m=3,d>=6) .. 5 Jul (m=6,d<=5)
  if ((m === 3 && d >= 6) || m === 4 || m === 5 || (m === 6 && d <= 5)) return 1;
  // Q2: 6 Jul .. 5 Oct
  if ((m === 6 && d >= 6) || m === 7 || m === 8 || (m === 9 && d <= 5)) return 2;
  // Q3: 6 Oct .. 5 Jan
  if ((m === 9 && d >= 6) || m === 10 || m === 11 || (m === 0 && d <= 5)) return 3;
  // Q4: 6 Jan .. 5 Apr
  return 4;
}

function urgencyFor(daysRemaining: number, isOverdue: boolean): Urgency {
  if (isOverdue) return "urgent";
  if (daysRemaining <= 7) return "urgent";
  if (daysRemaining <= 30) return "warning";
  return "ok";
}

/**
 * Returns the next upcoming MTD quarterly filing deadline relative to `fromDate`.
 * If today is past every deadline in the current tax year, walks into the next one.
 */
export function getNextDeadline(fromDate: Date = new Date()): NextDeadline {
  const today = startOfUtcDay(fromDate);
  const candidates: QuarterDeadline[] = [
    ...getQuarterDeadlines(getCurrentTaxYear(fromDate) - 1),
    ...getQuarterDeadlines(getCurrentTaxYear(fromDate)),
    ...getQuarterDeadlines(getCurrentTaxYear(fromDate) + 1),
  ];
  // First deadline strictly on/after today.
  const next = candidates.find((c) => c.deadline.getTime() >= today.getTime());
  if (!next) {
    // Unreachable in practice — but keep types honest.
    const fallback = candidates[candidates.length - 1];
    return { ...fallback, daysRemaining: 0, isOverdue: true, urgency: "urgent" };
  }
  const daysRemaining = Math.round((next.deadline.getTime() - today.getTime()) / MS_PER_DAY);
  const isOverdue = daysRemaining < 0;
  return {
    ...next,
    daysRemaining,
    isOverdue,
    urgency: urgencyFor(daysRemaining, isOverdue),
  };
}
