import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PupilLessonHistoryEntry {
  id: string;
  lesson_date: string;
  start_time: string | null;
  duration_minutes: number;
  skills_practiced: string[];
  notes: string | null;
  rating: number | null;
  next_lesson_plan: string | null;
}

export function usePupilLessonHistory(pupilId: string | null | undefined, limit = 10) {
  return useQuery({
    queryKey: ["pupil-lesson-history", pupilId, limit],
    queryFn: async (): Promise<PupilLessonHistoryEntry[]> => {
      if (!pupilId) return [];
      const { data, error } = await supabase
        .from("lesson_history")
        .select("id, lesson_date, start_time, duration_minutes, skills_practiced, notes, rating, next_lesson_plan")
        .eq("pupil_id", pupilId)
        .is("deleted_at", null)
        .order("lesson_date", { ascending: false })
        .order("start_time", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        skills_practiced: Array.isArray(d.skills_practiced) ? d.skills_practiced : [],
      }));
    },
    enabled: !!pupilId,
    staleTime: 60_000,
  });
}
