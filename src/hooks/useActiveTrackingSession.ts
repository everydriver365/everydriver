import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActiveTrackingSession {
  id: string;
  pupil_id: string | null;
  lesson_id: string | null;
}

/**
 * Returns the currently-open `lesson_telematics` row for the given instructor
 * (auto-started or manually-started — anything with `ended_at IS NULL`).
 *
 * Used by the background phone-GPS streamer mount so that whenever the
 * auto-start cron creates a session, the instructor's open app starts
 * streaming points without them needing to be on the tracking screen.
 */
export function useActiveTrackingSession(instructorId: string | null | undefined) {
  return useQuery({
    queryKey: ["active-tracking-session", instructorId],
    enabled: !!instructorId,
    refetchInterval: 10_000,
    queryFn: async (): Promise<ActiveTrackingSession | null> => {
      if (!instructorId) return null;
      const { data, error } = await supabase
        .from("lesson_telematics")
        .select("id, pupil_id, lesson_id")
        .eq("instructor_id", instructorId)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.warn("[useActiveTrackingSession]", error.message);
        return null;
      }
      return data ?? null;
    },
  });
}
