import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface MonthlyGoalData {
  lessonsThisMonth: number;
  lessonsCompleted: number;
  lessonsScheduled: number;
}

export function useMonthlyGoals(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["monthly-goals", instructorId],
    queryFn: async (): Promise<MonthlyGoalData> => {
      if (!instructorId) {
        return { lessonsThisMonth: 0, lessonsCompleted: 0, lessonsScheduled: 0 };
      }

      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const { data: lessons, error } = await supabase
        .from("scheduled_lessons")
        .select("status")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", format(monthStart, "yyyy-MM-dd"))
        .lte("lesson_date", format(monthEnd, "yyyy-MM-dd"))
        .neq("status", "cancelled");

      if (error) throw error;

      return {
        lessonsThisMonth: lessons?.length || 0,
        lessonsCompleted: lessons?.filter(l => l.status === "completed")?.length || 0,
        lessonsScheduled: lessons?.filter(l => l.status === "scheduled")?.length || 0,
      };
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });
}
