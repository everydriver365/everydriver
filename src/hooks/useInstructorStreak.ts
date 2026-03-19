import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, isAfter, startOfDay } from "date-fns";
import { useDemoMode } from "@/context/DemoModeContext";
import { demoStreak } from "@/data/demoData";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastTeachingDate: string | null;
  isActiveToday: boolean;
  streakMilestone: number | null; // 7, 30, 100 etc.
}

export function useInstructorStreak(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["instructor-streak", instructorId],
    queryFn: async (): Promise<StreakData> => {
      if (!instructorId) {
        return { currentStreak: 0, longestStreak: 0, lastTeachingDate: null, isActiveToday: false, streakMilestone: null };
      }

      // Get lessons from the last 100 days to calculate streak
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

      // Get unique teaching days
      const teachingDays = new Set(lessons?.map(l => l.lesson_date) || []);
      const sortedDays = Array.from(teachingDays).sort().reverse();

      // Calculate current streak
      let currentStreak = 0;
      let checkDate = new Date();
      
      // Check if they taught today
      const isActiveToday = teachingDays.has(today);
      
      // Start from today or yesterday depending on current time
      if (!isActiveToday) {
        checkDate = subDays(checkDate, 1);
      }

      // Count consecutive days
      while (true) {
        const dateStr = format(checkDate, "yyyy-MM-dd");
        if (teachingDays.has(dateStr)) {
          currentStreak++;
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      }

      // Calculate longest streak (simplified - just use current if it's the max we can see)
      let longestStreak = currentStreak;

      // Check for milestone
      const milestones = [100, 50, 30, 14, 7];
      const streakMilestone = milestones.find(m => currentStreak >= m && currentStreak < m + 1) || null;

      return {
        currentStreak,
        longestStreak,
        lastTeachingDate: sortedDays[0] || null,
        isActiveToday,
        streakMilestone,
      };
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
