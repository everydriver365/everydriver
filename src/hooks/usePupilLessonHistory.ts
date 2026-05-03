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
  status?: "completed" | "cancelled";
  cancellation_reason?: string | null;
  cancellation_note?: string | null;
  cancelled_by?: string | null;
}

export function usePupilLessonHistory(pupilId: string | null | undefined, limit = 10) {
  return useQuery({
    queryKey: ["pupil-lesson-history", pupilId, limit],
    queryFn: async (): Promise<PupilLessonHistoryEntry[]> => {
      if (!pupilId) return [];
      const [historyRes, cancelledRes] = await Promise.all([
        supabase
          .from("lesson_history")
          .select("id, lesson_date, start_time, duration_minutes, skills_practiced, notes, rating, next_lesson_plan")
          .eq("pupil_id", pupilId)
          .is("deleted_at", null)
          .order("lesson_date", { ascending: false })
          .order("start_time", { ascending: false })
          .limit(limit),
        supabase
          .from("scheduled_lessons")
          .select("id, lesson_date, start_time, duration_minutes, status, cancellation_reason, cancellation_note, cancelled_by, cancelled_at")
          .eq("pupil_id", pupilId)
          .eq("status", "cancelled")
          .is("deleted_at", null)
          .order("lesson_date", { ascending: false })
          .order("start_time", { ascending: false })
          .limit(limit),
      ]);
      if (historyRes.error) throw historyRes.error;
      if (cancelledRes.error) throw cancelledRes.error;

      const completed: PupilLessonHistoryEntry[] = (historyRes.data || []).map((d: any) => ({
        ...d,
        skills_practiced: Array.isArray(d.skills_practiced) ? d.skills_practiced : [],
        status: "completed" as const,
      }));
      const cancelled: PupilLessonHistoryEntry[] = (cancelledRes.data || []).map((d: any) => ({
        id: d.id,
        lesson_date: d.lesson_date,
        start_time: d.start_time,
        duration_minutes: d.duration_minutes,
        skills_practiced: [],
        notes: null,
        rating: null,
        next_lesson_plan: null,
        status: "cancelled" as const,
        cancellation_reason: d.cancellation_reason,
        cancellation_note: d.cancellation_note,
        cancelled_by: d.cancelled_by,
      }));

      const merged = [...completed, ...cancelled].sort((a, b) => {
        const da = `${a.lesson_date} ${a.start_time ?? ""}`;
        const db = `${b.lesson_date} ${b.start_time ?? ""}`;
        return db.localeCompare(da);
      });
      return merged.slice(0, limit);
    },
    enabled: !!pupilId,
    staleTime: 60_000,
  });
}
