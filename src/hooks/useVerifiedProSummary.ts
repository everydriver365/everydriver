import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VerifiedProSummary {
  instructor_id: string;
  badge_enabled: boolean;
  is_founding: boolean;
  verified_credential_count: number;
  verified_types: string[];
}

/**
 * Publicly-safe verified-pro summary for an instructor.
 * Backed by the SECURITY DEFINER RPC `get_verified_pro_summary`.
 * Returns null while loading or when the instructor has opted out
 * of showing the badge (badge_enabled = false).
 */
export function useVerifiedProSummary(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["verified-pro-summary", instructorId],
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<VerifiedProSummary | null> => {
      const { data, error } = await supabase.rpc("get_verified_pro_summary", {
        p_instructor_id: instructorId!,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return null;
      return row as VerifiedProSummary;
    },
  });
}
