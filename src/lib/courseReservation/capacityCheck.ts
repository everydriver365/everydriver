/**
 * Capacity check for the "Reserve start date only" booking flow.
 *
 * Given a pupil's preferences (start date, completion window, allowed days,
 * time-of-day windows, hours-per-week cap) and a course's total hour
 * requirement, this returns whether the instructor has enough free time to
 * complete the course inside the requested window — using the SAME
 * availability engine that powers the slot-by-slot flow (working hours +
 * Google Calendar mirror + manual blocks + buffers).
 *
 * Pure function. No network, no Supabase. Caller pre-loads sources via
 * loadCourseAvailabilitySources.
 */
import { addDays, addWeeks, differenceInCalendarWeeks, isAfter, startOfDay } from "date-fns";
import {
  computeDaySlots,
  type CourseAvailabilitySources,
  type InstructorLite,
} from "@/lib/courseAvailability";

export type TimeWindowKey = "morning" | "afternoon" | "evening";

export const TIME_WINDOW_RANGES: Record<TimeWindowKey, { startMin: number; endMin: number; label: string }> = {
  morning:   { startMin: 8 * 60,  endMin: 12 * 60, label: "Mornings (08–12)" },
  afternoon: { startMin: 12 * 60, endMin: 17 * 60, label: "Afternoons (12–17)" },
  evening:   { startMin: 17 * 60, endMin: 21 * 60, label: "Evenings (17–21)" },
};

export interface CapacityPrefs {
  startDate: Date;
  completionWeeks: number;
  /** ISO day-of-week numbers 0–6 where 0 = Sunday, 6 = Saturday. */
  allowedDays: number[];
  timeWindows: TimeWindowKey[];
  hoursPerWeekCap: number;
  /** Course hours that must fit. */
  totalHours: number;
}

export interface CapacityResult {
  ok: boolean;
  hoursAvailable: number;
  hoursRequired: number;
  shortfallHours: number;
  /** Which constraint was the most binding — drives suggestion bullets. */
  mostBinding: "days" | "time_windows" | "weeks" | "hours_per_week" | null;
}

/**
 * Run capacity check against a single instructor.
 *
 * @param instructor  Lite instructor row (must include id + booking lead config used by computeDaySlots).
 * @param prefs       Pupil preferences.
 * @param sources     Pre-loaded availability sources spanning [startDate, startDate + completionWeeks].
 * @param opts        Optional buffer/duration overrides; defaults mirror the public booking flow.
 */
export function checkReservationCapacity(
  instructor: InstructorLite,
  prefs: CapacityPrefs,
  sources: CourseAvailabilitySources,
  opts?: { durationMinutes?: number; bufferMinutes?: number; firstLessonBufferMinutes?: number; slotIncrementMinutes?: number },
): CapacityResult {
  const durationMinutes = opts?.durationMinutes ?? 60;
  const bufferMinutes = opts?.bufferMinutes ?? 0;
  const firstLessonBufferMinutes = opts?.firstLessonBufferMinutes ?? bufferMinutes;
  const slotIncrementMinutes = opts?.slotIncrementMinutes ?? 15;

  const windowStart = startOfDay(prefs.startDate);
  const windowEnd = addWeeks(windowStart, prefs.completionWeeks);

  // Pre-compute the union of allowed time-of-day minute ranges.
  const allowedRanges = prefs.timeWindows.map((k) => TIME_WINDOW_RANGES[k]).filter(Boolean);

  // Walk every day in the window, sum minutes of slots that match.
  // Pack into weekly bins capped by hoursPerWeekCap, so a pupil who wants
  // "10h/week" can't claim a single week where the instructor has 40h free.
  const weeklyMinutes = new Map<number, number>();

  for (let d = windowStart; !isAfter(d, windowEnd); d = addDays(d, 1)) {
    if (!prefs.allowedDays.includes(d.getDay())) continue;

    const { slots } = computeDaySlots(instructor, d, sources, {
      durationMinutes,
      bufferMinutes,
      firstLessonBufferMinutes,
      slotIncrementMinutes,
      respectAvailableFrom: true,
      timeOfDay: "any",
    });

    if (!slots.length) continue;

    // Sum minutes of the slots that fall inside one of the allowed time-of-day buckets.
    let dayMinutes = 0;
    for (const s of slots) {
      for (const r of allowedRanges) {
        const overlapStart = Math.max(s.start, r.startMin);
        const overlapEnd = Math.min(s.end, r.endMin);
        if (overlapEnd > overlapStart) {
          dayMinutes += overlapEnd - overlapStart;
        }
      }
    }

    if (dayMinutes <= 0) continue;

    const weekIdx = differenceInCalendarWeeks(d, windowStart);
    weeklyMinutes.set(weekIdx, (weeklyMinutes.get(weekIdx) ?? 0) + dayMinutes);
  }

  // Cap each week, then sum.
  const capMinutes = prefs.hoursPerWeekCap * 60;
  let totalCappedMinutes = 0;
  let anyWeekHitCap = false;
  for (const wkMin of weeklyMinutes.values()) {
    const capped = Math.min(wkMin, capMinutes);
    if (capped < wkMin) anyWeekHitCap = true;
    totalCappedMinutes += capped;
  }

  const hoursAvailable = totalCappedMinutes / 60;
  const hoursRequired = prefs.totalHours;
  const shortfallHours = Math.max(0, hoursRequired - hoursAvailable);
  const ok = hoursAvailable >= hoursRequired;

  // Heuristic for the binding constraint when we fall short.
  let mostBinding: CapacityResult["mostBinding"] = null;
  if (!ok) {
    if (anyWeekHitCap) {
      mostBinding = "hours_per_week";
    } else if (prefs.timeWindows.length < 3) {
      mostBinding = "time_windows";
    } else if (prefs.allowedDays.length < 7) {
      mostBinding = "days";
    } else {
      mostBinding = "weeks";
    }
  }

  return { ok, hoursAvailable, hoursRequired, shortfallHours, mostBinding };
}

export function describeBindingConstraint(binding: CapacityResult["mostBinding"]): string {
  switch (binding) {
    case "days": return "Try selecting more days of the week.";
    case "time_windows": return "Try adding another time-of-day window.";
    case "weeks": return "Try extending your completion window by a few weeks.";
    case "hours_per_week": return "Try raising the hours-per-week cap.";
    default: return "";
  }
}
