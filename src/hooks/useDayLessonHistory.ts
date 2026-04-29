import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

/**
 * Returns a Set of "EOL completed" keys for the given instructor + date.
 * Key shape: `${pupil_id}|${HH:MM:SS}` — matches scheduled_lessons.pupil_id
 * + start_time. EndLessonWizard inserts a lesson_history row keyed by this
 * tuple when the procedure completes, so presence in the set means the
 * end-of-lesson procedure has been run.
 */
export function useDayLessonHistory(instructorId: string | undefined, date: Date) {
  const dateStr = format(date, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["day-lesson-history", instructorId, dateStr],
    queryFn: async (): Promise<Set<string>> => {
      if (!instructorId) return new Set();

      const { data, error } = await supabase
        .from("lesson_history")
        .select("pupil_id, start_time")
        .eq("instructor_id", instructorId)
        .eq("lesson_date", dateStr);

      if (error) throw error;

      const set = new Set<string>();
      for (const row of data || []) {
        const t = (row as any).start_time as string | null;
        const pupilId = (row as any).pupil_id as string | null;
        if (!pupilId || !t) continue;
        set.add(eolKey(pupilId, t));
      }
      return set;
    },
    enabled: !!instructorId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function eolKey(pupilId: string, startTime: string): string {
  // Normalise to HH:MM:SS so HH:MM and HH:MM:SS both match.
  const norm = startTime.length === 5 ? `${startTime}:00` : startTime;
  return `${pupilId}|${norm}`;
}
