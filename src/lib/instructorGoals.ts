import type { RingsPeriod } from "@/hooks/useInstructorPeriodStats";

export interface PeriodGoals {
  lessons: number;
  earnings: number;
  hours: number;
}

export type AllGoals = Record<RingsPeriod, PeriodGoals>;

export const DEFAULT_GOALS: AllGoals = {
  today: { lessons: 4, earnings: 180, hours: 5 },
  week: { lessons: 20, earnings: 900, hours: 25 },
  month: { lessons: 80, earnings: 3600, hours: 100 },
};

const KEY_PREFIX = "instructor-rings-goals-v1:";

export function getDefaultGoals(period: RingsPeriod): PeriodGoals {
  return { ...DEFAULT_GOALS[period] };
}

export function loadGoals(instructorId: string | undefined): AllGoals {
  if (!instructorId || typeof window === "undefined") return cloneDefaults();
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + instructorId);
    if (!raw) return cloneDefaults();
    const parsed = JSON.parse(raw) as Partial<AllGoals>;
    return {
      today: { ...DEFAULT_GOALS.today, ...(parsed.today ?? {}) },
      week: { ...DEFAULT_GOALS.week, ...(parsed.week ?? {}) },
      month: { ...DEFAULT_GOALS.month, ...(parsed.month ?? {}) },
    };
  } catch {
    return cloneDefaults();
  }
}

export function saveGoals(instructorId: string | undefined, goals: AllGoals) {
  if (!instructorId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY_PREFIX + instructorId, JSON.stringify(goals));
  } catch {
    // ignore quota errors
  }
}

export function hasCustomGoals(instructorId: string | undefined): boolean {
  if (!instructorId || typeof window === "undefined") return false;
  return !!window.localStorage.getItem(KEY_PREFIX + instructorId);
}

function cloneDefaults(): AllGoals {
  return {
    today: { ...DEFAULT_GOALS.today },
    week: { ...DEFAULT_GOALS.week },
    month: { ...DEFAULT_GOALS.month },
  };
}
