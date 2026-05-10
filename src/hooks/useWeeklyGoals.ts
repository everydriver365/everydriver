import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { computeLessonAmount } from "@/lib/pricing/resolveHourlyRate";
import { fetchInstructorPostcodeRules } from "@/hooks/useInstructorPostcodeRules";


interface WeeklyGoalData {
  hoursThisWeek: number;
  hoursLastWeek: number;
  hoursGoal: number;
  lessonsThisWeek: number;
  lessonsCompleted: number;
  lessonsScheduled: number;
  earningsThisWeek: number;
  earningsLastWeek: number;
  progressPercent: number;
  isAheadOfLastWeek: boolean;
  dayOfWeek: number;
  expectedPace: number;
}

export function useWeeklyGoals(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["weekly-goals", instructorId],
    queryFn: async (): Promise<WeeklyGoalData> => {
      if (!instructorId) {
        return {
          hoursThisWeek: 0, hoursLastWeek: 0, hoursGoal: 30, lessonsThisWeek: 0,
          lessonsCompleted: 0, lessonsScheduled: 0, earningsThisWeek: 0, earningsLastWeek: 0,
          progressPercent: 0, isAheadOfLastWeek: false, dayOfWeek: new Date().getDay(), expectedPace: 0,
        };
      }

      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

      const { data: thisWeekLessons, error: thisWeekError } = await supabase
        .from("scheduled_lessons").select("duration_minutes, amount_due, status, pickup_postcode, pupils!inner (postcode, custom_hourly_rate, custom_rate_90min, custom_rate_120min)")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", format(weekStart, "yyyy-MM-dd"))
        .lte("lesson_date", format(weekEnd, "yyyy-MM-dd"))
        .neq("status", "cancelled");
      if (thisWeekError) throw thisWeekError;

      const { data: lastWeekLessons, error: lastWeekError } = await supabase
        .from("scheduled_lessons").select("duration_minutes, amount_due, pickup_postcode, pupils!inner (postcode, custom_hourly_rate, custom_rate_90min, custom_rate_120min)")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", format(lastWeekStart, "yyyy-MM-dd"))
        .lte("lesson_date", format(lastWeekEnd, "yyyy-MM-dd"))
        .neq("status", "cancelled");
      if (lastWeekError) throw lastWeekError;

      const [{ data: instructor }, postcodeRules] = await Promise.all([
        supabase.from("instructors").select("hourly_rate").eq("id", instructorId).maybeSingle(),
        fetchInstructorPostcodeRules(instructorId),
      ]);

      const hourlyRate = instructor?.hourly_rate || 35;
      const sumEarnings = (rows: any[] | null | undefined) =>
        (rows ?? []).reduce((s, l) => s + computeLessonAmount({
          durationMinutes: l.duration_minutes || 0,
          amountDue: l.amount_due,
          pupilCustomRate: l.pupils?.custom_hourly_rate,
          pupilCustomRate90: l.pupils?.custom_rate_90min,
          pupilCustomRate120: l.pupils?.custom_rate_120min,
          pupilPostcode: l.pupils?.postcode,
          lessonPostcode: l.pickup_postcode,
          instructorDefaultRate: hourlyRate,
          postcodeRules,
        }), 0);
      const minutesThisWeek = thisWeekLessons?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0;
      const minutesLastWeek = lastWeekLessons?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0;
      const hoursThisWeek = minutesThisWeek / 60;
      const hoursLastWeek = minutesLastWeek / 60;
      const hoursGoal = Math.max(30, Math.ceil(hoursLastWeek * 1.1));
      const earningsThisWeek = sumEarnings(thisWeekLessons);
      const earningsLastWeek = sumEarnings(lastWeekLessons);
      const progressPercent = hoursGoal > 0 ? Math.round((hoursThisWeek / hoursGoal) * 100) : 0;
      const dayOfWeek = now.getDay();
      const daysIntoPeriod = dayOfWeek === 0 ? 7 : dayOfWeek;
      const expectedPace = Math.round((daysIntoPeriod / 7) * 100);


      return {
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        hoursLastWeek: Math.round(hoursLastWeek * 10) / 10,
        hoursGoal,
        lessonsThisWeek: thisWeekLessons?.length || 0,
        lessonsCompleted: thisWeekLessons?.filter(l => l.status === 'completed')?.length || 0,
        lessonsScheduled: thisWeekLessons?.filter(l => l.status === 'scheduled')?.length || 0,
        earningsThisWeek: Math.round(earningsThisWeek),
        earningsLastWeek: Math.round(earningsLastWeek),
        progressPercent: Math.min(100, progressPercent),
        isAheadOfLastWeek: hoursThisWeek > hoursLastWeek * (daysIntoPeriod / 7),
        dayOfWeek,
        expectedPace,
      };
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });
}
