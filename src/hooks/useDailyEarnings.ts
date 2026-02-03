import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfWeek, endOfWeek, subWeeks } from "date-fns";

interface DailyEarning {
  date: string;
  amount: number;
}

interface EarningsData {
  dailyEarnings: DailyEarning[];
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  lastMonth: number;
  hoursThisMonth: number;
  hourlyRate: number;
}

export function useDailyEarnings(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["daily-earnings", instructorId],
    queryFn: async (): Promise<EarningsData> => {
      if (!instructorId) {
        return {
          dailyEarnings: [],
          thisWeek: 0,
          lastWeek: 0,
          thisMonth: 0,
          lastMonth: 0,
          hoursThisMonth: 0,
          hourlyRate: 40,
        };
      }

      // Get instructor's hourly rate
      const { data: instructor } = await supabase
        .from("instructors")
        .select("hourly_rate")
        .eq("id", instructorId)
        .maybeSingle();

      const hourlyRate = instructor?.hourly_rate || 40;

      // Get last 14 days of lessons
      const startDate = format(subDays(new Date(), 14), "yyyy-MM-dd");
      const { data: lessons } = await supabase
        .from("lesson_history")
        .select("lesson_date, duration_minutes")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", startDate);

      // Aggregate by day
      const dailyMap: Record<string, number> = {};
      lessons?.forEach((lesson) => {
        const date = lesson.lesson_date;
        const hours = (lesson.duration_minutes || 0) / 60;
        const amount = Math.round(hours * hourlyRate);
        dailyMap[date] = (dailyMap[date] || 0) + amount;
      });

      const dailyEarnings = Object.entries(dailyMap).map(([date, amount]) => ({
        date,
        amount,
      }));

      // Calculate weekly totals
      const now = new Date();
      const thisWeekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const thisWeekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const lastWeekStart = format(startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const lastWeekEnd = format(endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), "yyyy-MM-dd");

      const { data: thisWeekLessons } = await supabase
        .from("lesson_history")
        .select("duration_minutes")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", thisWeekStart)
        .lte("lesson_date", thisWeekEnd);

      const { data: lastWeekLessons } = await supabase
        .from("lesson_history")
        .select("duration_minutes")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", lastWeekStart)
        .lte("lesson_date", lastWeekEnd);

      const thisWeekHours = (thisWeekLessons?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0) / 60;
      const lastWeekHours = (lastWeekLessons?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0) / 60;

      // Monthly totals
      const monthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
      const lastMonthStart = format(new Date(now.getFullYear(), now.getMonth() - 1, 1), "yyyy-MM-dd");
      const lastMonthEnd = format(new Date(now.getFullYear(), now.getMonth(), 0), "yyyy-MM-dd");

      const { data: thisMonthLessons } = await supabase
        .from("lesson_history")
        .select("duration_minutes")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", monthStart);

      const { data: lastMonthLessons } = await supabase
        .from("lesson_history")
        .select("duration_minutes")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", lastMonthStart)
        .lte("lesson_date", lastMonthEnd);

      const thisMonthHours = (thisMonthLessons?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0) / 60;
      const lastMonthHours = (lastMonthLessons?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0) / 60;

      return {
        dailyEarnings,
        thisWeek: Math.round(thisWeekHours * hourlyRate),
        lastWeek: Math.round(lastWeekHours * hourlyRate),
        thisMonth: Math.round(thisMonthHours * hourlyRate),
        lastMonth: Math.round(lastMonthHours * hourlyRate),
        hoursThisMonth: Math.round(thisMonthHours),
        hourlyRate,
      };
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });
}
