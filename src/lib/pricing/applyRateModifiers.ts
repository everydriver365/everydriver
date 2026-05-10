/**
 * Surcharges applied on top of the resolved base hourly rate.
 *  - weekend: Saturday or Sunday
 *  - bank holiday: UK bank holiday (gov.uk feed, cached)
 *  - odd hours: lesson start time falls inside the configured window
 *
 * Surcharges are fixed £ amounts added to the per-hour rate.
 * Returns the modified rate plus a breakdown of which surcharges were applied.
 */

export interface RateModifiers {
  weekend_surcharge_amount?: number | null;
  bank_holiday_surcharge_amount?: number | null;
  odd_hours_surcharge_amount?: number | null;
  odd_hours_start?: string | null; // "HH:MM[:SS]"
  odd_hours_end?: string | null;   // "HH:MM[:SS]"
}

export interface AppliedSurcharge {
  type: "weekend" | "bank_holiday" | "odd_hours";
  amount: number; // £ per hour
}

export interface ModifiedRate {
  baseRate: number;
  finalRate: number;
  surcharges: AppliedSurcharge[];
  totalAmount: number; // £ added to baseRate per hour
}

/* ---------------- UK bank holidays (gov.uk, cached) ---------------- */

const BH_CACHE_KEY = "ukBankHolidays:v1";
let bhMemo: Set<string> | null = null;

export async function loadUkBankHolidays(): Promise<Set<string>> {
  if (bhMemo) return bhMemo;
  try {
    const cached = sessionStorage.getItem(BH_CACHE_KEY);
    if (cached) {
      const parsed: string[] = JSON.parse(cached);
      bhMemo = new Set(parsed);
      return bhMemo;
    }
  } catch {}
  try {
    const res = await fetch("https://www.gov.uk/bank-holidays.json");
    if (!res.ok) return (bhMemo = new Set());
    const json = await res.json();
    const dates = new Set<string>();
    for (const region of ["england-and-wales", "scotland", "northern-ireland"]) {
      const events = json?.[region]?.events ?? [];
      for (const e of events) if (e?.date) dates.add(e.date);
    }
    try { sessionStorage.setItem(BH_CACHE_KEY, JSON.stringify([...dates])); } catch {}
    bhMemo = dates;
    return dates;
  } catch {
    return (bhMemo = new Set());
  }
}

export function getCachedUkBankHolidays(): Set<string> {
  if (bhMemo) return bhMemo;
  try {
    const cached = sessionStorage.getItem(BH_CACHE_KEY);
    if (cached) { bhMemo = new Set(JSON.parse(cached)); return bhMemo; }
  } catch {}
  return new Set();
}

/* ---------------- Helpers ---------------- */

function toMinutes(t?: string | null): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function isOddHour(startTime: string, oddStart: string, oddEnd: string): boolean {
  const s = toMinutes(startTime);
  const a = toMinutes(oddStart);
  const b = toMinutes(oddEnd);
  if (s == null || a == null || b == null) return false;
  if (a === b) return false;
  if (a < b) return s >= a && s < b;
  return s >= a || s < b; // wrapped midnight
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ---------------- Main ---------------- */

export function applyRateModifiers(args: {
  baseRate: number | null | undefined;
  lessonDate?: string | Date | null;
  lessonStartTime?: string | null;
  modifiers?: RateModifiers | null;
  bankHolidaySet?: Set<string>;
}): ModifiedRate {
  const base = Number(args.baseRate || 0);
  const surcharges: AppliedSurcharge[] = [];
  if (!args.modifiers || !base) {
    return { baseRate: base, finalRate: base, surcharges, totalAmount: 0 };
  }

  const m = args.modifiers;
  const bh = args.bankHolidaySet ?? getCachedUkBankHolidays();

  let date: Date | null = null;
  let dateStr: string | null = null;
  if (args.lessonDate instanceof Date) {
    date = args.lessonDate;
    dateStr = ymd(date);
  } else if (typeof args.lessonDate === "string" && args.lessonDate) {
    const [y, mo, d] = args.lessonDate.slice(0, 10).split("-").map(Number);
    if (y && mo && d) {
      date = new Date(y, mo - 1, d);
      dateStr = args.lessonDate.slice(0, 10);
    }
  }

  if (date) {
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isBH = !!dateStr && bh.has(dateStr);

    if (isBH && Number(m.bank_holiday_surcharge_amount) > 0) {
      surcharges.push({ type: "bank_holiday", amount: Number(m.bank_holiday_surcharge_amount) });
    } else if (isWeekend && Number(m.weekend_surcharge_amount) > 0) {
      surcharges.push({ type: "weekend", amount: Number(m.weekend_surcharge_amount) });
    }
  }

  if (
    args.lessonStartTime &&
    Number(m.odd_hours_surcharge_amount) > 0 &&
    m.odd_hours_start && m.odd_hours_end &&
    isOddHour(args.lessonStartTime, m.odd_hours_start, m.odd_hours_end)
  ) {
    surcharges.push({ type: "odd_hours", amount: Number(m.odd_hours_surcharge_amount) });
  }

  const totalAmount = surcharges.reduce((s, x) => s + x.amount, 0);
  const finalRate = Math.round((base + totalAmount) * 100) / 100;
  return { baseRate: base, finalRate, surcharges, totalAmount };
}

export function describeSurcharge(s: AppliedSurcharge): string {
  const amt = `+£${s.amount.toFixed(2)}/hr`;
  switch (s.type) {
    case "weekend": return `Weekend (${amt})`;
    case "bank_holiday": return `Bank holiday (${amt})`;
    case "odd_hours": return `Off-peak hours (${amt})`;
  }
}
