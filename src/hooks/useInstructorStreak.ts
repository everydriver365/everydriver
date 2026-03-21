import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastTeachingDate: string | null;
  isActiveToday: boolean;
  streakMilestone: number | null;
}

export function useInstructorStreak(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["instructor-streak", instructorId],
    queryFn: async (): Promise<StreakData> => {
      if (!instructorId) {
        return { currentStreak: 0, longestStreak: 0, lastTeachingDate: null, isActiveToday: false, streakMilestone: null };
      }

      const startDate = format(subDays(new Date(), 100), "yyyy-MM-dd");
      const today = format(new Date(), "yyyy-MM-dd");

      const { data: lessons, error } = await supabase
        .from("scheduled_lessons")
        .select("lesson_date")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", startDate)
        .neq("status", "cancelled")
        .order("lesson_date", { ascending: false });

      if (error) throw error;

      const teachingDays = new Set(lessons?.map(l => l.lesson_date) || []);
      const sortedDays = Array.from(teachingDays).sort().reverse();
      let currentStreak = 0;
      let checkDate = new Date();
      const isActiveToday = teachingDays.has(today);

      if (!isActiveToday) checkDate = subDays(checkDate, 1);

      while (true) {
        const dateStr = format(checkDate, "yyyy-MM-dd");
        if (teachingDays.has(dateStr)) { currentStreak++; checkDate = subDays(checkDate, 1); }
        else break;
      }

      const milestones = [100, 50, 30, 14, 7];
      const streakMilestone = milestones.find(m => currentStreak >= m && currentStreak < m + 1) || null;

      return { currentStreak, longestStreak: currentStreak, lastTeachingDate: sortedDays[0] || null, isActiveToday, streakMilestone };
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });
}
