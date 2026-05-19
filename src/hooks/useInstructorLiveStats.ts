import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";

interface LiveStatsData {
  hoursThisWeek: number;
  lessonsThisWeek: number;
  monthEarnings: number;
}

async function fetchLiveStats(instructorId: string): Promise<LiveStatsData> {
  const now = new Date();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const { data: weekLessons, error: weekError } = await supabase
    .from("scheduled_lessons")
    .select("duration_minutes, pupils!inner(deleted_at)")
    .eq("instructor_id", instructorId)
    .gte("lesson_date", weekStart)
    .lte("lesson_date", weekEnd)
    .neq("status", "cancelled")
    .is("pupils.deleted_at", null);
  if (weekError) throw weekError;

  const totalMinutes =
    weekLessons?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0;
  const hoursThisWeek = Math.round((totalMinutes / 60) * 10) / 10;
  const lessonsThisWeek = weekLessons?.length || 0;

  const { data: monthPayments, error: monthError } = await supabase
    .from("payment_history")
    .select("amount")
    .eq("instructor_id", instructorId)
    .gte("created_at", `${monthStart}T00:00:00`)
    .lte("created_at", `${monthEnd}T23:59:59`);
  if (monthError) throw monthError;

  const monthEarnings =
    monthPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  return { hoursThisWeek, lessonsThisWeek, monthEarnings };
}

export function useInstructorLiveStats(instructorId: string | undefined) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["instructor-live-stats", instructorId],
    queryFn: () => fetchLiveStats(instructorId as string),
    enabled: !!instructorId,
    staleTime: 30_000,
  });

  return {
    hoursThisWeek: data?.hoursThisWeek ?? 0,
    lessonsThisWeek: data?.lessonsThisWeek ?? 0,
    monthEarnings: data?.monthEarnings ?? 0,
    loading: isLoading,
    refresh: refetch,
  };
}
