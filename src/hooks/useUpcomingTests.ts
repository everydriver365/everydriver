import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays, parseISO } from "date-fns";

export interface UpcomingTest {
  id: string;
  pupilName: string;
  testDate: string;
  testTime: string | null;
  testCentreName: string | null;
  testType: string; // "practical" or "mock"
  daysUntil: number;
  isUrgent: boolean;
}

export function useUpcomingTests(instructorId: string | undefined) {
  const today = format(new Date(), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["upcoming-tests", instructorId, today],
    queryFn: async (): Promise<UpcomingTest[]> => {
      if (!instructorId) return [];

      const { data, error } = await supabase
        .from("driving_test_results")
        .select(`
          id, test_date, test_time, result, is_mock,
          pupils!inner (name),
          test_centres (name)
        `)
        .eq("instructor_id", instructorId)
        .gte("test_date", today)
        .in("result", ["pending", "scheduled", "booked"])
        .order("test_date", { ascending: true })
        .limit(5);

      if (error) throw error;

      return (data || []).map((t) => {
        const pupil = (t as any).pupils;
        const centre = (t as any).test_centres;
        const daysUntil = differenceInDays(parseISO(t.test_date), new Date());
        return {
          id: t.id,
          pupilName: pupil?.name || "Unknown",
          testDate: t.test_date,
          testTime: t.test_time,
          testCentreName: centre?.name || null,
          testType: t.is_mock ? "mock" : "practical",
          daysUntil,
          isUrgent: daysUntil <= 7,
        };
      });
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });
}
