import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the number of active smart nudges for the instructor, sourced
 * from the same `generate-nudges` edge function used by SmartNudgesCard.
 * Cached for 5 minutes to avoid hammering the function from every tile mount.
 */
export function useSmartNudgesCount(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["smart-nudges-count", instructorId],
    queryFn: async (): Promise<number> => {
      if (!instructorId) return 0;
      try {
        const { data, error } = await supabase.functions.invoke("generate-nudges", {
          body: { instructor_id: instructorId },
        });
        if (error) return 0;
        return Array.isArray(data?.nudges) ? data.nudges.length : 0;
      } catch {
        return 0;
      }
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
