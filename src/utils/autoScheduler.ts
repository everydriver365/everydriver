import { supabase } from "@/integrations/supabase/client";
import {
  loadCourseAvailabilitySources,
  computeDaySlots,
  type InstructorLite,
} from "@/lib/courseAvailability";

interface SlotCandidate {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  score: number;
}

interface AutoScheduleParams {
  instructorId: string;
  totalHours: number;
  lessonLength: number; // in minutes
  preferredTimes?: string[]; // 'morning', 'afternoon', 'evening'
  preferredDays?: string[]; // 'monday', 'tuesday', etc.
  courseType?: 'intensive' | 'semi-intensive' | 'weekly';
  startFromDate?: Date;
  preferEarliestSlot?: boolean;
}

const TIME_RANGES = {
  morning: { start: 7, end: 12 },
  afternoon: { start: 12, end: 17 },
  evening: { start: 17, end: 20 },
};

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Auto-schedule a course by finding optimal slots.
 *
 * UNIFIED ENGINE: This function delegates ALL slot generation to
 * `computeDaySlots` in `src/lib/courseAvailability.ts` — the same engine used
 * by the public booking page, /courses discovery and the create-booking guard.
 *
 * BUSYNESS SOURCE: Google Calendar + manual blocks only (loaded via
 * `loadCourseAvailabilitySources`). `scheduled_lessons` is CRM data and is
 * NEVER consulted for availability.
 */
export async function findOptimalSlots(params: AutoScheduleParams): Promise<SlotCandidate[]> {
  const {
    instructorId,
    totalHours,
    lessonLength,
    preferredTimes = [],
    preferredDays = [],
    courseType = 'weekly',
    startFromDate = new Date(),
    preferEarliestSlot = false,
  } = params;

  const totalMinutesNeeded = totalHours * 60;
  const lookAheadDays = courseType === 'intensive' ? 14 : courseType === 'semi-intensive' ? 30 : 60;

  const fromDate = new Date(startFromDate);
  const toDate = addDays(startFromDate, lookAheadDays);

  // Load the instructor row + all shared availability sources via the unified loader.
  const [instructorRes, sources] = await Promise.all([
    supabase
      .from('instructors')
      .select('id, available_from, buffer_minutes, slot_increment_minutes, first_lesson_buffer_minutes, min_notice_minutes, is_network_placeholder')
      .eq('id', instructorId)
      .maybeSingle(),
    loadCourseAvailabilitySources(supabase, [instructorId], fromDate, toDate),
  ]);

  const instructorRow = (instructorRes.data || { id: instructorId }) as any;
  const instructor: InstructorLite = {
    id: instructorId,
    available_from: instructorRow.available_from ?? null,
    buffer_minutes: instructorRow.buffer_minutes ?? 0,
    is_network_placeholder: instructorRow.is_network_placeholder ?? false,
  };

  const slotIncrement = instructorRow.slot_increment_minutes ?? undefined;
  const firstLessonBuffer = instructorRow.first_lesson_buffer_minutes ?? undefined;
  const minNotice = instructorRow.min_notice_minutes ?? undefined;
  const buffer = instructorRow.buffer_minutes ?? 0;

  // Generate candidates day-by-day via the unified engine.
  const allCandidates: SlotCandidate[] = [];

  for (let dayOffset = 0; dayOffset < lookAheadDays; dayOffset++) {
    const date = addDays(startFromDate, dayOffset);
    const dateStr = formatDate(date);
    const dayName = DAY_NAMES[date.getDay()];

    const { slots } = computeDaySlots(instructor, date, sources, {
      durationMinutes: lessonLength,
      bufferMinutes: buffer,
      firstLessonBufferMinutes: firstLessonBuffer,
      slotIncrementMinutes: slotIncrement,
      minNoticeMinutes: minNotice,
    });

    for (const slot of slots) {
      allCandidates.push({
        date: dateStr,
        startTime: minutesToTime(slot.start),
        endTime: minutesToTime(slot.end),
        duration: lessonLength,
        score: calculateScore(slot.start, dayName, preferredTimes, preferredDays, courseType, preferEarliestSlot),
      });
    }
  }

  // Sort by score (highest first)
  allCandidates.sort((a, b) => b.score - a.score);

  // Select slots until we have enough hours, respecting course-type rules.
  const selectedSlots: SlotCandidate[] = [];
  let scheduledMinutes = 0;
  const usedDates = new Set<string>();

  for (const candidate of allCandidates) {
    if (scheduledMinutes >= totalMinutesNeeded) break;

    const hasConflict = selectedSlots.some(
      s => s.date === candidate.date &&
      !(parseTime(candidate.endTime) <= parseTime(s.startTime) ||
        parseTime(candidate.startTime) >= parseTime(s.endTime))
    );
    if (hasConflict) continue;

    if (courseType === 'weekly') {
      if (usedDates.has(candidate.date)) continue;
    } else if (courseType === 'semi-intensive') {
      const sameDayCount = selectedSlots.filter(s => s.date === candidate.date).length;
      if (sameDayCount >= 2) continue;
    }

    selectedSlots.push(candidate);
    scheduledMinutes += candidate.duration;
    usedDates.add(candidate.date);
  }

  selectedSlots.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return parseTime(a.startTime) - parseTime(b.startTime);
  });

  return selectedSlots;
}

function calculateScore(
  timeMinutes: number,
  dayName: string,
  preferredTimes: string[],
  preferredDays: string[],
  courseType: string,
  preferEarliestSlot: boolean = false
): number {
  let score = 50;
  const timeHour = timeMinutes / 60;

  if (preferredTimes.length > 0) {
    for (const pref of preferredTimes) {
      const range = TIME_RANGES[pref as keyof typeof TIME_RANGES];
      if (range && timeHour >= range.start && timeHour < range.end) {
        score += 20;
        break;
      }
    }
  }

  if (preferredDays.length > 0 && preferredDays.includes(dayName)) {
    score += 15;
  }

  if (courseType === 'intensive') {
    if (timeHour >= 9 && timeHour <= 15) score += 5;
  } else if (courseType === 'weekly') {
    if (timeHour >= 10 && timeHour <= 14) score += 3;
  }

  if (preferEarliestSlot) {
    const earliestBonus = Math.max(0, Math.round(20 - (timeHour - 7) * (20 / 13)));
    score += earliestBonus;
  }

  return score;
}

export function formatSlotForDisplay(slot: SlotCandidate): string {
  const date = new Date(slot.date);
  const dayName = date.toLocaleDateString('en-GB', { weekday: 'short' });
  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const formatDisplayTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  return `${dayName} ${dateStr}, ${formatDisplayTime(slot.startTime)} - ${formatDisplayTime(slot.endTime)}`;
}
