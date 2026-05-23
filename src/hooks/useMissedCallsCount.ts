import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MISSED_STATUSES = ["missed", "no-answer", "no_answer", "failed", "busy"];

export function useMissedCallsCount(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["missed-calls-count", instructorId],
    enabled: !!instructorId,
    staleTime: 60_000,
    queryFn: async (): Promise<number> => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from("famulor_call_logs")
        .select("id", { count: "exact", head: true })
        .eq("instructor_id", instructorId!)
        .eq("direction", "inbound")
        .in("status", MISSED_STATUSES)
        .gte("created_at", sevenDaysAgo);
      if (error) throw error;
      return count ?? 0;
    },
  });
}
