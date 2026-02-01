import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";

interface WeeklyGoalData {
  hoursThisWeek: number;
  hoursLastWeek: number;
  hoursGoal: number;
  lessonsThisWeek: number;
  earningsThisWeek: number;
  earningsLastWeek: number;
  progressPercent: number;
  isAheadOfLastWeek: boolean;
  dayOfWeek: number; // 0-6, Sunday = 0
  expectedPace: number; // What % we should be at for this day of week
}

export function useWeeklyGoals(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["weekly-goals", instructorId],
    queryFn: async (): Promise<WeeklyGoalData> => {
      if (!instructorId) {
        return {
          hoursThisWeek: 0,
          hoursLastWeek: 0,
          hoursGoal: 30,
          lessonsThisWeek: 0,
          earningsThisWeek: 0,
          earningsLastWeek: 0,
          progressPercent: 0,
          isAheadOfLastWeek: false,
          dayOfWeek: new Date().getDay(),
          expectedPace: 0,
        };
      }

      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

      // Get this week's lessons
      const { data: thisWeekLessons, error: thisWeekError } = await supabase
        .from("scheduled_lessons")
        .select("duration_minutes, amount_due")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", format(weekStart, "yyyy-MM-dd"))
        .lte("lesson_date", format(weekEnd, "yyyy-MM-dd"))
        .neq("status", "cancelled");

      if (thisWeekError) throw thisWeekError;

      // Get last week's lessons
      const { data: lastWeekLessons, error: lastWeekError } = await supabase
        .from("scheduled_lessons")
        .select("duration_minutes, amount_due")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", format(lastWeekStart, "yyyy-MM-dd"))
        .lte("lesson_date", format(lastWeekEnd, "yyyy-MM-dd"))
        .neq("status", "cancelled");

      if (lastWeekError) throw lastWeekError;

      // Get hourly rate
      const { data: instructor } = await supabase
        .from("instructors")
        .select("hourly_rate")
        .eq("id", instructorId)
        .maybeSingle();

      const hourlyRate = instructor?.hourly_rate || 35;
      
      const minutesThisWeek = thisWeekLessons?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0;
      const minutesLastWeek = lastWeekLessons?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0;
      
      const hoursThisWeek = minutesThisWeek / 60;
      const hoursLastWeek = minutesLastWeek / 60;
      
      // Default goal: 30 hours or last week's hours + 10%
      const hoursGoal = Math.max(30, Math.ceil(hoursLastWeek * 1.1));
      
      const earningsThisWeek = hoursThisWeek * hourlyRate;
      const earningsLastWeek = hoursLastWeek * hourlyRate;
      
      const progressPercent = hoursGoal > 0 ? Math.round((hoursThisWeek / hoursGoal) * 100) : 0;
      
      // Calculate expected pace based on day of week (Mon=0% start, Sun=100%)
      const dayOfWeek = now.getDay();
      const daysIntoPeriod = dayOfWeek === 0 ? 7 : dayOfWeek; // Sunday = 7
      const expectedPace = Math.round((daysIntoPeriod / 7) * 100);
      
      return {
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        hoursLastWeek: Math.round(hoursLastWeek * 10) / 10,
        hoursGoal,
        lessonsThisWeek: thisWeekLessons?.length || 0,
        earningsThisWeek: Math.round(earningsThisWeek),
        earningsLastWeek: Math.round(earningsLastWeek),
        progressPercent: Math.min(100, progressPercent),
        isAheadOfLastWeek: hoursThisWeek > hoursLastWeek * (daysIntoPeriod / 7),
        dayOfWeek,
        expectedPace,
      };
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
