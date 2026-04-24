import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

/**
 * Counts active pupils whose most recent (non-cancelled) lesson was more
 * than 14 days ago. Mirrors the logic used by DormantPupilsCard so the
 * tile badge and the detail page agree.
 */
export function useDormantPupilsCount(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["dormant-pupils-count", instructorId],
    queryFn: async (): Promise<number> => {
      if (!instructorId) return 0;

      const { data: pupils } = await supabase
        .from("pupils")
        .select("id")
        .eq("instructor_id", instructorId)
        .is("deleted_at", null)
        .eq("status", "active");

      if (!pupils || pupils.length === 0) return 0;

      const cutoff = format(subDays(new Date(), 14), "yyyy-MM-dd");
      let dormant = 0;

      // Cap at first 30 to mirror DormantPupilsCard's bounded scan.
      for (const pupil of pupils.slice(0, 30)) {
        const { data: lastLesson } = await supabase
          .from("scheduled_lessons")
          .select("lesson_date")
          .eq("pupil_id", pupil.id)
          .neq("status", "cancelled")
          .order("lesson_date", { ascending: false })
          .limit(1);

        const lastDate = lastLesson?.[0]?.lesson_date;
        if (!lastDate || lastDate < cutoff) dormant++;
      }

      return dormant;
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });
}
