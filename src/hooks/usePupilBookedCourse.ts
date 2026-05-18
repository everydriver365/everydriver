import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PupilBookedCourse {
  id: string;
  totalLessons: number;
  lessonLengthMinutes: number;
}

/**
 * Returns the pupil's most recently booked course (confirmed/converted proposal).
 * Total lessons = number of generated slots in the proposal.
 * Returns null when the pupil has no booked course (live-data: never invent).
 */
export function usePupilBookedCourse(pupilId: string | undefined) {
  return useQuery({
    queryKey: ["pupil-booked-course", pupilId],
    enabled: !!pupilId,
    queryFn: async (): Promise<PupilBookedCourse | null> => {
      const { data, error } = await supabase
        .from("course_proposals")
        .select("id, generated_slots, lesson_length_minutes, status, created_at")
        .eq("pupil_id", pupilId!)
        .in("status", ["confirmed", "converted"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const slots = Array.isArray(data.generated_slots) ? data.generated_slots : [];
      return {
        id: data.id,
        totalLessons: slots.length,
        lessonLengthMinutes: data.lesson_length_minutes,
      };
    },
  });
}
