import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { computeLessonAmount } from "@/lib/pricing/resolveHourlyRate";
import { fetchInstructorPostcodeRules } from "@/hooks/useInstructorPostcodeRules";


interface LastWeekComparison {
  hoursThisWeek: number;
  hoursLastWeek: number;
  percentChange: number;
  lessonsThisWeek: number;
  lessonsLastWeek: number;
  earningsThisWeek: number;
  earningsLastWeek: number;
  isImprovement: boolean;
}

export function useLastWeekComparison(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["last-week-comparison", instructorId],
    queryFn: async (): Promise<LastWeekComparison> => {
      if (!instructorId) {
        return {
          hoursThisWeek: 0,
          hoursLastWeek: 0,
          percentChange: 0,
          lessonsThisWeek: 0,
          lessonsLastWeek: 0,
          earningsThisWeek: 0,
          earningsLastWeek: 0,
          isImprovement: false,
        };
      }

      const now = new Date();
      const thisWeekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const thisWeekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const lastWeekStart = format(startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const lastWeekEnd = format(endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), "yyyy-MM-dd");

      // Get lessons for both weeks
      const [thisWeekResult, lastWeekResult, instructorResult] = await Promise.all([
        supabase
          .from("scheduled_lessons")
          .select("duration_minutes")
          .eq("instructor_id", instructorId)
          .gte("lesson_date", thisWeekStart)
          .lte("lesson_date", thisWeekEnd)
          .neq("status", "cancelled"),
        supabase
          .from("scheduled_lessons")
          .select("duration_minutes")
          .eq("instructor_id", instructorId)
          .gte("lesson_date", lastWeekStart)
          .lte("lesson_date", lastWeekEnd)
          .neq("status", "cancelled"),
        supabase
          .from("instructors")
          .select("hourly_rate")
          .eq("id", instructorId)
          .maybeSingle(),
      ]);

      const hourlyRate = instructorResult.data?.hourly_rate || 35;

      const thisWeekMinutes = thisWeekResult.data?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0;
      const lastWeekMinutes = lastWeekResult.data?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0;

      const hoursThisWeek = thisWeekMinutes / 60;
      const hoursLastWeek = lastWeekMinutes / 60;

      const percentChange = hoursLastWeek > 0 
        ? Math.round(((hoursThisWeek - hoursLastWeek) / hoursLastWeek) * 100)
        : hoursThisWeek > 0 ? 100 : 0;

      return {
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        hoursLastWeek: Math.round(hoursLastWeek * 10) / 10,
        percentChange,
        lessonsThisWeek: thisWeekResult.data?.length || 0,
        lessonsLastWeek: lastWeekResult.data?.length || 0,
        earningsThisWeek: Math.round(hoursThisWeek * hourlyRate),
        earningsLastWeek: Math.round(hoursLastWeek * hourlyRate),
        isImprovement: hoursThisWeek >= hoursLastWeek,
      };
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });
}
