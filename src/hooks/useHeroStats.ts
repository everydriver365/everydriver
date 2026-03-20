import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear } from "date-fns";

export interface PeriodStats {
  label: string;
  lessons: number;
  completed: number;
  hours: number;
  earnings: number;
}

export interface HeroStatsData {
  today: PeriodStats;
  week: PeriodStats;
  month: PeriodStats;
  year: PeriodStats;
}

export function useHeroStats(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["hero-stats", instructorId],
    queryFn: async (): Promise<HeroStatsData> => {
      if (!instructorId) {
        const empty: PeriodStats = { label: "", lessons: 0, completed: 0, hours: 0, earnings: 0 };
        return { today: { ...empty, label: "Today" }, week: { ...empty, label: "This Week" }, month: { ...empty, label: "This Month" }, year: { ...empty, label: "Year to Date" } };
      }

      const now = new Date();
      const todayStr = format(now, "yyyy-MM-dd");
      const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
      const yearStart = format(startOfYear(now), "yyyy-MM-dd");

      // Fetch all lessons for YTD (covers all periods)
      const { data: lessons, error } = await supabase
        .from("scheduled_lessons")
        .select("lesson_date, start_time, duration_minutes, status")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", yearStart)
        .lte("lesson_date", todayStr)
        .neq("status", "cancelled");

      if (error) throw error;

      // Fetch hourly rate
      const { data: inst } = await supabase
        .from("instructors")
        .select("hourly_rate")
        .eq("id", instructorId)
        .maybeSingle();

      const rate = inst?.hourly_rate || 35;

      // Also fetch payment history for actual earnings
      const { data: payments } = await supabase
        .from("payment_history")
        .select("amount, created_at")
        .eq("instructor_id", instructorId)
        .gte("created_at", `${yearStart}T00:00:00`);

      const calcPeriod = (startDate: string, endDate: string, label: string): PeriodStats => {
        const filtered = (lessons || []).filter(l => l.lesson_date >= startDate && l.lesson_date <= endDate);
        const totalLessons = filtered.length;
        const completed = filtered.filter(l => l.status === "completed").length;
        const totalMinutes = filtered.reduce((s, l) => s + (l.duration_minutes || 0), 0);
        const hours = Math.round(totalMinutes / 60 * 10) / 10;
        const earnings = Math.round(hours * rate);
        return { label, lessons: totalLessons, completed, hours, earnings };
      };

      return {
        today: calcPeriod(todayStr, todayStr, "Today"),
        week: calcPeriod(weekStart, weekEnd, "This Week"),
        month: calcPeriod(monthStart, monthEnd, "This Month"),
        year: calcPeriod(yearStart, todayStr, "Year to Date"),
      };
    },
    enabled: !!instructorId,
    staleTime: 2 * 60 * 1000,
  });
}
