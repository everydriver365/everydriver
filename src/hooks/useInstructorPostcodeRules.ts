import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PostcodeRateRule } from "@/lib/pricing/resolveHourlyRate";

/**
 * Fetch per-postcode hourly rate overrides for an instructor.
 * Cached for 5 minutes — overrides change infrequently.
 */
export function useInstructorPostcodeRules(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["instructor-postcode-rules", instructorId],
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PostcodeRateRule[]> => {
      const { data, error } = await supabase
        .from("instructor_postcode_rates")
        .select("outward_code, hourly_rate")
        .eq("instructor_id", instructorId!);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        outward_code: String(r.outward_code).toUpperCase(),
        hourly_rate: Number(r.hourly_rate),
      }));
    },
  });
}

/** Non-hook fetch for use inside React Query queryFns. */
export async function fetchInstructorPostcodeRules(
  instructorId: string,
): Promise<PostcodeRateRule[]> {
  const { data } = await supabase
    .from("instructor_postcode_rates")
    .select("outward_code, hourly_rate")
    .eq("instructor_id", instructorId);
  return (data ?? []).map((r: any) => ({
    outward_code: String(r.outward_code).toUpperCase(),
    hourly_rate: Number(r.hourly_rate),
  }));
}
