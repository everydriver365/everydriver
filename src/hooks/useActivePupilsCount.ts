import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Counts the active (non-soft-deleted) pupils for an instructor.
 * Used by the "Pupils" rich tile badge in the Frequently used grid.
 */
export function useActivePupilsCount(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["active-pupils-count", instructorId],
    queryFn: async (): Promise<number> => {
      if (!instructorId) return 0;
      const { count, error } = await supabase
        .from("pupils")
        .select("id", { count: "exact", head: true })
        .eq("instructor_id", instructorId)
        .is("deleted_at", null)
        .eq("status", "active");
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });
}
