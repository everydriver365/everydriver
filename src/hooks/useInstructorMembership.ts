import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InstructorMembership {
  planName: string; // e.g. "Free", "Starter", "Pro", "Premium"
  planSlug: string | null;
  status: string | null;
}

/**
 * Returns the instructor's current active membership plan (live).
 * Defaults to "Free" when no active subscription is found.
 */
export function useInstructorMembership(instructorId: string | undefined) {
  return useQuery<InstructorMembership>({
    queryKey: ["instructor-membership", instructorId],
    queryFn: async () => {
      if (!instructorId) {
        return { planName: "Free", planSlug: null, status: null };
      }

      const { data: sub } = await supabase
        .from("instructor_subscriptions")
        .select("status, subscription_plans(name, slug)")
        .eq("instructor_id", instructorId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      const plan = (sub as any)?.subscription_plans;
      if (!plan?.name) {
        return { planName: "Free", planSlug: null, status: null };
      }

      return {
        planName: plan.name as string,
        planSlug: (plan.slug ?? null) as string | null,
        status: ((sub as any)?.status ?? null) as string | null,
      };
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });
}
