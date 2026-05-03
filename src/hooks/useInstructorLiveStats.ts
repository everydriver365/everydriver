import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";

interface LiveStats {
  hoursThisWeek: number;
  lessonsThisWeek: number;
  monthEarnings: number;
  loading: boolean;
}

export function useInstructorLiveStats(instructorId: string | undefined) {
  const [stats, setStats] = useState<LiveStats>({
    hoursThisWeek: 0,
    lessonsThisWeek: 0,
    monthEarnings: 0,
    loading: true,
  });

  const fetchStats = useCallback(async () => {
    if (!instructorId) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const now = new Date();
      const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

      const { data: weekLessons, error: weekError } = await supabase
        .from("scheduled_lessons")
        .select("duration_minutes")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", weekStart)
        .lte("lesson_date", weekEnd)
        .neq("status", "cancelled");

      if (weekError) throw weekError;

      const totalMinutes = weekLessons?.reduce((sum, lesson) => sum + (lesson.duration_minutes || 0), 0) || 0;
      const hoursThisWeek = Math.round(totalMinutes / 60 * 10) / 10;
      const lessonsThisWeek = weekLessons?.length || 0;

      const { data: monthPayments, error: monthError } = await supabase
        .from("payment_history")
        .select("amount")
        .eq("instructor_id", instructorId)
        .gte("created_at", `${monthStart}T00:00:00`)
        .lte("created_at", `${monthEnd}T23:59:59`);

      if (monthError) throw monthError;

      const monthEarnings = monthPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      setStats({ hoursThisWeek, lessonsThisWeek, monthEarnings, loading: false });
    } catch (error) {
      console.error("Error fetching live stats:", error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [instructorId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { ...stats, refresh: fetchStats };
}
