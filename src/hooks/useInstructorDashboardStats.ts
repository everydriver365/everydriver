import { useQuery } from "@tanstack/react-query";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export interface InstructorDashboardStats {
  lessonsThisMonth: number;
  cancelledThisMonth: number;
  testsBooked: number;
  passRatePct: number | null;
  passRateSampleSize: number;
  waitingListCount: number;
  testSwapOpenCount: number;
  coursesCount: number;
  cpdThisYear: number;
  cpdTarget: number | null;
  invoicesUnpaid: number;
  standardsCheck: { result: string; at: string } | null;
  nextTestDate: string | null;
}

async function fetchStats(instructorId: string): Promise<InstructorDashboardStats> {
  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const twelveMonthsAgo = format(startOfMonth(subMonths(now, 12)), "yyyy-MM-dd");
  const yearStart = `${now.getFullYear()}-01-01`;
  const today = format(now, "yyyy-MM-dd");

  const [
    lessonsBookedRes,
    cancelledRes,
    testsBookedRes,
    dvsaResultsRes,
    waitlistRes,
    testSwapRes,
    coursesRes,
    cpdRes,
    invoicesRes,
    instructorRes,
  ] = await Promise.all([
    supabase
      .from("scheduled_lessons")
      .select("id", { count: "exact", head: true })
      .eq("instructor_id", instructorId)
      .gte("lesson_date", monthStart)
      .lte("lesson_date", monthEnd)
      .neq("status", "cancelled"),
    supabase
      .from("scheduled_lessons")
      .select("id", { count: "exact", head: true })
      .eq("instructor_id", instructorId)
      .gte("lesson_date", monthStart)
      .lte("lesson_date", monthEnd)
      .eq("status", "cancelled"),
    supabase
      .from("test_requests")
      .select("id", { count: "exact", head: true })
      .eq("instructor_id", instructorId)
      .gte("test_date", today)
      .not("status", "in", "(cancelled,completed)"),
    supabase
      .from("driving_test_results")
      .select("result, is_mock, test_date")
      .eq("instructor_id", instructorId)
      .eq("is_mock", false)
      .gte("test_date", twelveMonthsAgo),
    supabase
      .from("lesson_waitlist")
      .select("id", { count: "exact", head: true })
      .eq("instructor_id", instructorId)
      .eq("is_active", true),
    supabase
      .from("test_swap_offers")
      .select("id, test_requests!inner(instructor_id)", { count: "exact", head: true })
      .eq("test_requests.instructor_id", instructorId)
      .eq("status", "pending"),
    supabase
      .from("instructor_courses")
      .select("id", { count: "exact", head: true })
      .eq("instructor_id", instructorId)
      .eq("is_active", true),
    supabase
      .from("cpd_log_entries")
      .select("id", { count: "exact", head: true })
      .eq("instructor_id", instructorId)
      .gte("date", yearStart),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("instructor_id", instructorId)
      .neq("status", "paid"),
    supabase
      .from("instructors")
      .select("cpd_year_target, standards_check_result, standards_check_at")
      .eq("id", instructorId)
      .maybeSingle(),
  ]);

  // Pass rate
  const dvsaRows = dvsaResultsRes.data ?? [];
  const sampleSize = dvsaRows.length;
  const passed = dvsaRows.filter((r: any) => {
    const v = String(r.result ?? "").toLowerCase();
    return v === "pass" || v === "passed";
  }).length;
  const passRatePct = sampleSize > 0 ? Math.round((passed / sampleSize) * 100) : null;

  const instructor = instructorRes.data as
    | { cpd_year_target: number | null; standards_check_result: string | null; standards_check_at: string | null }
    | null;

  const standardsCheck =
    instructor?.standards_check_result && instructor?.standards_check_at
      ? { result: instructor.standards_check_result, at: instructor.standards_check_at }
      : null;

  return {
    lessonsThisMonth: lessonsBookedRes.count ?? 0,
    cancelledThisMonth: cancelledRes.count ?? 0,
    testsBooked: testsBookedRes.count ?? 0,
    passRatePct,
    passRateSampleSize: sampleSize,
    waitingListCount: waitlistRes.count ?? 0,
    testSwapOpenCount: testSwapRes.count ?? 0,
    coursesCount: coursesRes.count ?? 0,
    cpdThisYear: cpdRes.count ?? 0,
    cpdTarget: instructor?.cpd_year_target != null ? Number(instructor.cpd_year_target) : null,
    invoicesUnpaid: invoicesRes.count ?? 0,
    standardsCheck,
  };
}

export function useInstructorDashboardStats(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["instructor-dashboard-stats", instructorId],
    queryFn: () => fetchStats(instructorId!),
    enabled: !!instructorId,
    staleTime: 2 * 60 * 1000,
  });
}
