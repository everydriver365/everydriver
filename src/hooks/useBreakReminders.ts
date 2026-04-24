import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { format, parseISO, addMinutes, differenceInMinutes, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";

interface ScheduledLesson {
  id: string;
  start_time: string;
  duration_minutes: number;
  pupil_id: string;
}

interface BreakSlot {
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  suggestion: BreakSuggestion;
}

interface BreakSuggestion {
  title: string;
  description: string;
  icon: string;
  category: "stretch" | "hydration" | "eyes" | "walk" | "breathing";
}

const BREAK_SUGGESTIONS: BreakSuggestion[] = [
  {
    title: "Quick Stretch",
    description: "Stretch your neck and shoulders for 2 minutes",
    icon: "Dumbbell",
    category: "stretch",
  },
  {
    title: "Hydration Break",
    description: "Drink a glass of water and take 5 deep breaths",
    icon: "GlassWater",
    category: "hydration",
  },
  {
    title: "Eye Rest",
    description: "Look at something 20 feet away for 20 seconds",
    icon: "Eye",
    category: "eyes",
  },
  {
    title: "Short Walk",
    description: "Walk around your car or to a nearby spot",
    icon: "Footprints",
    category: "walk",
  },
  {
    title: "Breathing Exercise",
    description: "4-7-8 breathing: inhale 4s, hold 7s, exhale 8s",
    icon: "Wind",
    category: "breathing",
  },
];

export function useBreakReminders() {
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id;
  const today = format(new Date(), "yyyy-MM-dd");

  // Fetch today's lessons
  const { data: lessons, isLoading } = useQuery({
    queryKey: ["today-lessons", instructorId, today],
    queryFn: async () => {
      if (!instructorId) return [];

      const startOfToday = startOfDay(new Date()).toISOString();
      const endOfToday = endOfDay(new Date()).toISOString();

      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select("id, start_time, duration_minutes, pupil_id")
        .eq("instructor_id", instructorId)
        .gte("start_time", startOfToday)
        .lte("start_time", endOfToday)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return (data || []) as ScheduledLesson[];
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate gaps between lessons
  const breakSlots = useMemo(() => {
    if (!lessons || lessons.length === 0) return [];

    const gaps: BreakSlot[] = [];
    const now = new Date();
    const minGapMinutes = 30; // Minimum gap to suggest a break

    for (let i = 0; i < lessons.length - 1; i++) {
      const currentLesson = lessons[i];
      const nextLesson = lessons[i + 1];

      // Calculate end time from start_time + duration_minutes
      const currentStart = parseISO(currentLesson.start_time);
      const currentEnd = addMinutes(currentStart, currentLesson.duration_minutes);
      const nextStart = parseISO(nextLesson.start_time);

      const gapMinutes = differenceInMinutes(nextStart, currentEnd);

      // Only include gaps that are in the future and at least 30 minutes
      if (gapMinutes >= minGapMinutes && isAfter(currentEnd, now)) {
        // Pick a suggestion based on gap index (cycles through)
        const suggestion = BREAK_SUGGESTIONS[i % BREAK_SUGGESTIONS.length];

        gaps.push({
          startTime: currentEnd,
          endTime: nextStart,
          durationMinutes: gapMinutes,
          suggestion,
        });
      }
    }

    return gaps;
  }, [lessons]);

  // Get the next upcoming break
  const nextBreak = useMemo(() => {
    const now = new Date();
    return breakSlots.find((slot) => isAfter(slot.startTime, now)) || null;
  }, [breakSlots]);

  // Get the current break (if we're in a gap now)
  const currentBreak = useMemo(() => {
    const now = new Date();
    return breakSlots.find(
      (slot) => isAfter(now, slot.startTime) && isBefore(now, slot.endTime)
    ) || null;
  }, [breakSlots]);

  // Get minutes until next break
  const minutesUntilNextBreak = useMemo(() => {
    if (!nextBreak) return null;
    return differenceInMinutes(nextBreak.startTime, new Date());
  }, [nextBreak]);

  // Format time for display
  const formatBreakTime = (date: Date) => format(date, "HH:mm");

  // Get break description
  const getBreakDescription = (slot: BreakSlot) => {
    if (slot.durationMinutes >= 60) {
      const hours = Math.floor(slot.durationMinutes / 60);
      const mins = slot.durationMinutes % 60;
      return mins > 0 ? `${hours}h ${mins}m break` : `${hours}h break`;
    }
    return `${slot.durationMinutes}m break`;
  };

  return {
    // Data
    lessons,
    breakSlots,
    nextBreak,
    currentBreak,
    minutesUntilNextBreak,
    
    // Loading
    isLoading,
    
    // Helpers
    formatBreakTime,
    getBreakDescription,
    
    // Counts
    totalBreaksToday: breakSlots.length,
    hasBreaksAvailable: breakSlots.length > 0,
  };
}
