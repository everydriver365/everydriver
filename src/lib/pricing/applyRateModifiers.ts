/**
 * Surcharges applied on top of the resolved base hourly rate.
 *  - weekend: Saturday or Sunday
 *  - bank holiday: UK bank holiday (gov.uk feed, cached)
 *  - odd hours: lesson start time falls inside the configured window
 *
 * Returns the modified rate plus a breakdown of which surcharges were applied.
 */

export interface RateModifiers {
  weekend_surcharge_pct?: number | null;
  bank_holiday_surcharge_pct?: number | null;
  odd_hours_surcharge_pct?: number | null;
  odd_hours_start?: string | null; // "HH:MM[:SS]"
  odd_hours_end?: string | null;   // "HH:MM[:SS]"
}

export interface AppliedSurcharge {
  type: "weekend" | "bank_holiday" | "odd_hours";
  pct: number;
}

export interface ModifiedRate {
  baseRate: number;
  finalRate: number;
  surcharges: AppliedSurcharge[];
  totalPct: number;
}

/* ---------------- UK bank holidays (gov.uk, cached) ---------------- */

const BH_CACHE_KEY = "ukBankHolidays:v1";
let bhMemo: Set<string> | null = null;

export async function loadUkBankHolidays(): Promise<Set<string>> {
  if (bhMemo) return bhMemo;
  // session cache
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
    // Use England & Wales by default (most users); merge Scotland/NI to be permissive.
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
  // Window may wrap midnight (e.g. 20:00 -> 07:00).
  if (a === b) return false;
  if (a < b) return s >= a && s < b;
  return s >= a || s < b; // wrapped
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
  lessonDate?: string | Date | null;       // "YYYY-MM-DD" or Date
  lessonStartTime?: string | null;         // "HH:MM" (24h)
  modifiers?: RateModifiers | null;
  bankHolidaySet?: Set<string>;            // pre-loaded; defaults to cached
}): ModifiedRate {
  const base = Number(args.baseRate || 0);
  const surcharges: AppliedSurcharge[] = [];
  if (!args.modifiers || !base) {
    return { baseRate: base, finalRate: base, surcharges, totalPct: 0 };
  }

  const m = args.modifiers;
  const bh = args.bankHolidaySet ?? getCachedUkBankHolidays();

  let date: Date | null = null;
  let dateStr: string | null = null;
  if (args.lessonDate instanceof Date) {
    date = args.lessonDate;
    dateStr = ymd(date);
  } else if (typeof args.lessonDate === "string" && args.lessonDate) {
    // Treat as local-date YYYY-MM-DD
    const [y, mo, d] = args.lessonDate.slice(0, 10).split("-").map(Number);
    if (y && mo && d) {
      date = new Date(y, mo - 1, d);
      dateStr = args.lessonDate.slice(0, 10);
    }
  }

  if (date) {
    const dow = date.getDay(); // 0 Sun, 6 Sat
    const isWeekend = dow === 0 || dow === 6;
    const isBH = !!dateStr && bh.has(dateStr);

    if (isBH && Number(m.bank_holiday_surcharge_pct) > 0) {
      surcharges.push({ type: "bank_holiday", pct: Number(m.bank_holiday_surcharge_pct) });
    } else if (isWeekend && Number(m.weekend_surcharge_pct) > 0) {
      // Bank holiday takes priority over weekend; don't double-apply.
      surcharges.push({ type: "weekend", pct: Number(m.weekend_surcharge_pct) });
    }
  }

  if (
    args.lessonStartTime &&
    Number(m.odd_hours_surcharge_pct) > 0 &&
    m.odd_hours_start && m.odd_hours_end &&
    isOddHour(args.lessonStartTime, m.odd_hours_start, m.odd_hours_end)
  ) {
    surcharges.push({ type: "odd_hours", pct: Number(m.odd_hours_surcharge_pct) });
  }

  const totalPct = surcharges.reduce((s, x) => s + x.pct, 0);
  const finalRate = Math.round(base * (1 + totalPct / 100) * 100) / 100;
  return { baseRate: base, finalRate, surcharges, totalPct };
}

export function describeSurcharge(s: AppliedSurcharge): string {
  switch (s.type) {
    case "weekend": return `Weekend (+${s.pct}%)`;
    case "bank_holiday": return `Bank holiday (+${s.pct}%)`;
    case "odd_hours": return `Off-peak hours (+${s.pct}%)`;
  }
}
