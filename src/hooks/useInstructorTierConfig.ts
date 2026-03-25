import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TierConfig {
  ratePercent: number;
  fixedFeePence: number;
}

/**
 * Fetches the commission rates for an instructor based on their active subscription plan.
 * Returns null if no plan found (will fall back to global/free-tier rates in useAdminFee).
 */
export function useInstructorTierConfig(instructorId: string | undefined): TierConfig | null {
  const { data } = useQuery({
    queryKey: ["instructor-tier-config", instructorId],
    queryFn: async () => {
      if (!instructorId) return null;

      const { data: sub } = await supabase
        .from("instructor_subscriptions")
        .select("plan_id, subscription_plans(commission_rate_percent, commission_fixed_pence)")
        .eq("instructor_id", instructorId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      const plan = (sub as any)?.subscription_plans;
      if (!plan || plan.commission_rate_percent == null) return null;

      return {
        ratePercent: plan.commission_rate_percent as number,
        fixedFeePence: (plan.commission_fixed_pence ?? 25) as number,
      };
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });

  return data ?? null;
}
