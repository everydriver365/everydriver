import { supabase } from "@/integrations/supabase/client";

interface WorkingHours {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface DateOverride {
  override_date: string;
  is_available: boolean;
  start_time?: string;
  end_time?: string;
}

interface ScheduledLesson {
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
}

interface ExternalEvent {
  event_date: string;
  start_time: string;
  end_time: string;
}

interface ManualBlock {
  block_date: string;
  start_time: string;
  end_time: string;
}

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

// Time ranges for preferences
const TIME_RANGES = {
  morning: { start: 7, end: 12 },
  afternoon: { start: 12, end: 17 },
  evening: { start: 17, end: 20 },
};

// Day name to number mapping (0 = Sunday, 1 = Monday, etc.)
const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDayOfWeek(date: Date): number {
  return date.getDay();
}

function getDayName(dayNumber: number): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayNumber];
}

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

  // Fetch all availability data.
  // BUSYNESS SOURCE: Google Calendar (`get_public_instructor_calendar_blocks`) +
  // manual blocks (`get_public_instructor_manual_blocks`) only.
  // scheduled_lessons is CRM data and must NEVER be consulted for availability.
  const fromDate = formatDate(startFromDate);
  const toDate = formatDate(addDays(startFromDate, lookAheadDays));
  const fromIso = new Date(`${fromDate}T00:00:00`).toISOString();
  const toIso = new Date(`${toDate}T23:59:59`).toISOString();
  const [workingHoursRes, overridesRes, calendarRes, manualBlocksRes] = await Promise.all([
    supabase
      .from('instructor_working_hours')
      .select('*')
      .eq('instructor_id', instructorId),
    supabase
      .from('instructor_date_overrides')
      .select('*')
      .eq('instructor_id', instructorId)
      .gte('override_date', fromDate)
      .lte('override_date', toDate),
    (supabase as any).rpc('get_public_instructor_calendar_blocks', {
      p_instructor_ids: [instructorId],
      p_from_datetime: fromIso,
      p_to_datetime: toIso,
    }),
    supabase.rpc('get_public_instructor_manual_blocks', {
      p_instructor_ids: [instructorId],
      p_from_datetime: fromIso,
      p_to_datetime: toIso,
    }),
  ]);

  const workingHours = (workingHoursRes.data || []) as unknown as WorkingHours[];
  const overrides = (overridesRes.data || []) as unknown as DateOverride[];

  // Filter out all-day / multi-day Google Calendar events consistent with
  // src/lib/availabilityEngine.ts (informational items like "Summer term").
  const isAllDayLike = (startIso: string, endIso: string): boolean => {
    const s = new Date(startIso);
    const e = new Date(endIso);
    const durMs = e.getTime() - s.getTime();
    if (durMs >= 20 * 60 * 60 * 1000) return true;
    const startsAtMidnight = s.getUTCHours() === 0 && s.getUTCMinutes() === 0;
    const endsAtMidnight = e.getUTCHours() === 0 && e.getUTCMinutes() === 0;
    return startsAtMidnight && endsAtMidnight && durMs >= 12 * 60 * 60 * 1000;
  };

  type RawBlock = { start_time?: string; end_time?: string; start_datetime?: string; end_datetime?: string; is_busy?: boolean };
  const calendarBlocks: { start: Date; end: Date }[] = ((calendarRes.data || []) as RawBlock[])
    .filter((e) => e.is_busy !== false)
    .filter((e) => !isAllDayLike(e.start_time!, e.end_time!))
    .map((e) => ({ start: new Date(e.start_time!), end: new Date(e.end_time!) }));
  const manualBlockEvents: { start: Date; end: Date }[] = ((manualBlocksRes.data || []) as RawBlock[])
    .map((b) => ({ start: new Date(b.start_datetime!), end: new Date(b.end_datetime!) }));
  const allBusyBlocks = [...calendarBlocks, ...manualBlockEvents];

  // Generate all possible slots for each day
  const allCandidates: SlotCandidate[] = [];

  for (let dayOffset = 0; dayOffset < lookAheadDays; dayOffset++) {
    const date = addDays(startFromDate, dayOffset);
    const dateStr = formatDate(date);
    const dayOfWeek = getDayOfWeek(date);
    const dayName = getDayName(dayOfWeek);

    // Check for date override
    const override = overrides.find(o => o.override_date === dateStr);

    let dayStart: number;
    let dayEnd: number;

    if (override) {
      if (!override.is_available) continue; // Day is blocked
      dayStart = parseTime(override.start_time || '09:00');
      dayEnd = parseTime(override.end_time || '17:00');
    } else {
      const hours = workingHours.find(h => h.day_of_week === dayOfWeek && h.is_active);
      if (!hours) continue; // Not working this day
      dayStart = parseTime(hours.start_time);
      dayEnd = parseTime(hours.end_time);
    }

    // Build blocked intervals for this day from calendar + manual blocks
    // (clip to the day in local time).
    const dayStartLocal = new Date(date); dayStartLocal.setHours(0, 0, 0, 0);
    const dayEndLocal = new Date(date); dayEndLocal.setHours(23, 59, 59, 999);
    const blockedSlots: { start: number; end: number }[] = [];
    for (const b of allBusyBlocks) {
      if (b.end <= dayStartLocal || b.start >= dayEndLocal) continue;
      const s = b.start < dayStartLocal ? dayStartLocal : b.start;
      const e = b.end > dayEndLocal ? dayEndLocal : b.end;
      const startMin = s.getHours() * 60 + s.getMinutes();
      const endMin = (e.getHours() * 60 + e.getMinutes()) || 24 * 60;
      blockedSlots.push({ start: startMin, end: endMin });
    }

    // Sort blocked slots
    blockedSlots.sort((a, b) => a.start - b.start);

    // Find available slots
    let currentTime = dayStart;

    for (const blocked of blockedSlots) {
      if (currentTime + lessonLength <= blocked.start) {
        // There's room before this blocked slot
        const slotEnd = Math.min(blocked.start, dayEnd);
        while (currentTime + lessonLength <= slotEnd) {
          allCandidates.push({
            date: dateStr,
            startTime: formatTime(currentTime),
            endTime: formatTime(currentTime + lessonLength),
            duration: lessonLength,
            score: calculateScore(currentTime, dayName, preferredTimes, preferredDays, courseType, preferEarliestSlot),
          });
          currentTime += 30; // 30-min increments
        }
      }
      currentTime = Math.max(currentTime, blocked.end);
    }

    // Check remaining time after all blocks
    while (currentTime + lessonLength <= dayEnd) {
      allCandidates.push({
        date: dateStr,
        startTime: formatTime(currentTime),
        endTime: formatTime(currentTime + lessonLength),
        duration: lessonLength,
        score: calculateScore(currentTime, dayName, preferredTimes, preferredDays, courseType, preferEarliestSlot),
      });
      currentTime += 30;
    }
  }

  // Sort by score (highest first)
  allCandidates.sort((a, b) => b.score - a.score);

  // Select slots until we have enough hours
  const selectedSlots: SlotCandidate[] = [];
  let scheduledMinutes = 0;
  const usedDates = new Set<string>();

  for (const candidate of allCandidates) {
    if (scheduledMinutes >= totalMinutesNeeded) break;

    // Check for conflicts with already selected slots
    const hasConflict = selectedSlots.some(
      s => s.date === candidate.date && 
      !(parseTime(candidate.endTime) <= parseTime(s.startTime) || 
        parseTime(candidate.startTime) >= parseTime(s.endTime))
    );

    if (hasConflict) continue;

    // Course type specific rules
    if (courseType === 'weekly') {
      // Max 1 lesson per day for weekly
      if (usedDates.has(candidate.date)) continue;
    } else if (courseType === 'semi-intensive') {
      // Max 2 lessons per day for semi-intensive
      const sameDayCount = selectedSlots.filter(s => s.date === candidate.date).length;
      if (sameDayCount >= 2) continue;
    }
    // Intensive: no limit on lessons per day

    selectedSlots.push(candidate);
    scheduledMinutes += candidate.duration;
    usedDates.add(candidate.date);
  }

  // Sort selected slots by date and time
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
  let score = 50; // Base score

  const timeHour = timeMinutes / 60;

  // Time preference matching
  if (preferredTimes.length > 0) {
    for (const pref of preferredTimes) {
      const range = TIME_RANGES[pref as keyof typeof TIME_RANGES];
      if (range && timeHour >= range.start && timeHour < range.end) {
        score += 20;
        break;
      }
    }
  }

  // Day preference matching
  if (preferredDays.length > 0) {
    if (preferredDays.includes(dayName)) {
      score += 15;
    }
  }

  // Course type bonuses
  if (courseType === 'intensive') {
    // Prefer mid-day slots for intensive
    if (timeHour >= 9 && timeHour <= 15) score += 5;
  } else if (courseType === 'weekly') {
    // Prefer consistent timing
    if (timeHour >= 10 && timeHour <= 14) score += 3;
  }

  // Earliest slot priority: heavily boost earlier times
  if (preferEarliestSlot) {
    // Max bonus at 7am (+20), linearly decreasing to 0 at 8pm
    const earliestBonus = Math.max(0, Math.round(20 - (timeHour - 7) * (20 / 13)));
    score += earliestBonus;
  }

  return score;
}

export function formatSlotForDisplay(slot: SlotCandidate): string {
  const date = new Date(slot.date);
  const dayName = date.toLocaleDateString('en-GB', { weekday: 'short' });
  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  
  // Format times
  const formatDisplayTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return `${dayName} ${dateStr}, ${formatDisplayTime(slot.startTime)} - ${formatDisplayTime(slot.endTime)}`;
}
