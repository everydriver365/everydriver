import { useQuery } from "@tanstack/react-query";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";

const FREE_MONTHLY_LIMIT = 5;

export function usePaymentLimit() {
  const { instructor, hasFeature } = useInstructorAuth();
  const hasFull = hasFeature("payment_tracking");
  const instructorId = instructor?.id;

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  const { data: count = 0 } = useQuery({
    queryKey: ["payment-limit", instructorId, monthStart],
    queryFn: async () => {
      if (!instructorId || hasFull) return 0;
      // @ts-ignore
      const { count, error } = await supabase
        .from("payment_history")
        .select("id", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .gte("recorded_at", monthStart)
        .lte("recorded_at", monthEnd);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!instructorId && !hasFull,
  });

  if (hasFull) {
    return { count: 0, limit: Infinity, isAtLimit: false, remaining: Infinity, isLimited: false };
  }

  return {
    count,
    limit: FREE_MONTHLY_LIMIT,
    isAtLimit: count >= FREE_MONTHLY_LIMIT,
    remaining: Math.max(0, FREE_MONTHLY_LIMIT - count),
    isLimited: true,
  };
}
