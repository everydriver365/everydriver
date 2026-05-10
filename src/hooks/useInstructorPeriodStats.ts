import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { computeLessonAmount } from "@/lib/pricing/resolveHourlyRate";
import { fetchInstructorPostcodeRules } from "@/hooks/useInstructorPostcodeRules";


export type RingsPeriod = "today" | "week" | "month";

export interface PeriodStats {
  lessons: number;
  earnings: number;
  hours: number; // taught hours (one decimal)
}

function rangeFor(period: RingsPeriod) {
  const now = new Date();
  if (period === "today") return { start: now, end: now };
  if (period === "week")
    return {
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
    };
  return { start: startOfMonth(now), end: endOfMonth(now) };
}

async function fetchStats(
  instructorId: string,
  period: RingsPeriod
): Promise<PeriodStats> {
  const { start, end } = rangeFor(period);
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  const [lessonsRes, instructorRes, postcodeRules] = await Promise.all([
    supabase
      .from("scheduled_lessons")
      .select("duration_minutes, amount_due, status, pickup_postcode, pupils!inner (postcode, custom_hourly_rate, custom_rate_90min, custom_rate_120min)")
      .eq("instructor_id", instructorId)
      .gte("lesson_date", startStr)
      .lte("lesson_date", endStr)
      .neq("status", "cancelled"),
    supabase
      .from("instructors")
      .select("hourly_rate")
      .eq("id", instructorId)
      .maybeSingle(),
    fetchInstructorPostcodeRules(instructorId),
  ]);

  const lessons = lessonsRes.data ?? [];
  const hourlyRate = instructorRes.data?.hourly_rate ?? 35;
  const minutes = lessons.reduce(
    (sum, l) => sum + (l.duration_minutes || 0),
    0,
  );
  const hours = Math.round((minutes / 60) * 10) / 10;
  const earnings = Math.round(
    lessons.reduce((sum, l: any) => sum + computeLessonAmount({
      durationMinutes: l.duration_minutes || 0,
      amountDue: l.amount_due,
      pupilCustomRate: l.pupils?.custom_hourly_rate,
      pupilCustomRate90: l.pupils?.custom_rate_90min,
      pupilCustomRate120: l.pupils?.custom_rate_120min,
      pupilPostcode: l.pupils?.postcode,
      lessonPostcode: l.pickup_postcode,
      instructorDefaultRate: hourlyRate,
      postcodeRules,
    }), 0),
  );

  return { lessons: lessons.length, earnings, hours };
}

export function useInstructorPeriodStats(
  instructorId: string | undefined,
  period: RingsPeriod
) {
  return useQuery({
    queryKey: ["instructor-rings-stats", instructorId, period],
    queryFn: () => fetchStats(instructorId!, period),
    enabled: !!instructorId,
    staleTime: 2 * 60 * 1000,
  });
}
