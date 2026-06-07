import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PupilLessonStatus = "upcoming" | "completed" | "cancelled" | "pending_review";

export interface PupilLessonHistoryEntry {
  id: string;
  lesson_date: string;
  start_time: string | null;
  duration_minutes: number;
  skills_practiced: string[];
  notes: string | null;
  rating: number | null;
  next_lesson_plan: string | null;
  status: PupilLessonStatus;
  cancellation_reason?: string | null;
  cancellation_note?: string | null;
  cancelled_by?: string | null;
  is_rescheduled?: boolean;
  pickup_location?: string | null;
}

export function usePupilLessonHistory(
  pupilId: string | null | undefined,
  limit = 100,
  options: { includeUpcoming?: boolean } = {},
) {
  const includeUpcoming = options.includeUpcoming ?? false;
  return useQuery({
    queryKey: ["pupil-lesson-history", pupilId, limit, includeUpcoming],
    queryFn: async (): Promise<PupilLessonHistoryEntry[]> => {

      if (!pupilId) return [];
      const today = new Date().toISOString().slice(0, 10);

      const [historyRes, scheduledRes] = await Promise.all([
        supabase
          .from("lesson_history")
          .select("id, lesson_date, start_time, duration_minutes, skills_practiced, notes, rating, next_lesson_plan, scheduled_lesson_id")
          .eq("pupil_id", pupilId)
          .is("deleted_at", null)
          .order("lesson_date", { ascending: false })
          .order("start_time", { ascending: false })
          .limit(limit),
        supabase
          .from("scheduled_lessons")
          .select("id, lesson_date, start_time, duration_minutes, status, cancellation_reason, cancellation_note, cancelled_by, original_lesson_id, pickup_location")
          .eq("pupil_id", pupilId)
          .is("deleted_at", null)
          .order("lesson_date", { ascending: false })
          .order("start_time", { ascending: false })
          .limit(limit * 2),
      ]);
      if (historyRes.error) throw historyRes.error;
      if (scheduledRes.error) throw scheduledRes.error;

      const completed: PupilLessonHistoryEntry[] = (historyRes.data || []).map((d: any) => ({
        id: d.id,
        lesson_date: d.lesson_date,
        start_time: d.start_time,
        duration_minutes: d.duration_minutes,
        skills_practiced: Array.isArray(d.skills_practiced) ? d.skills_practiced : [],
        notes: d.notes ?? null,
        rating: d.rating ?? null,
        next_lesson_plan: d.next_lesson_plan ?? null,
        status: "completed" as const,
      }));

      // Build a set of scheduled_lesson_ids that already have a lesson_history
      // record, so we can identify past scheduled lessons that were never
      // marked complete (those previously vanished from the pupil record).
      const reviewedScheduledIds = new Set<string>(
        (historyRes.data || [])
          .map((d: any) => d.scheduled_lesson_id)
          .filter((v: any): v is string => !!v),
      );

      const upcoming: PupilLessonHistoryEntry[] = [];
      const pendingReview: PupilLessonHistoryEntry[] = [];
      const cancelled: PupilLessonHistoryEntry[] = [];
      for (const d of (scheduledRes.data || []) as any[]) {
        const base: PupilLessonHistoryEntry = {
          id: d.id,
          lesson_date: d.lesson_date,
          start_time: d.start_time,
          duration_minutes: d.duration_minutes,
          skills_practiced: [],
          notes: null,
          rating: null,
          next_lesson_plan: null,
          status: "upcoming",
          pickup_location: d.pickup_location ?? null,
          is_rescheduled: !!d.original_lesson_id,
        };
        if (d.status === "cancelled") {
          cancelled.push({
            ...base,
            status: "cancelled",
            cancellation_reason: d.cancellation_reason,
            cancellation_note: d.cancellation_note,
            cancelled_by: d.cancelled_by,
          });
        } else if (d.lesson_date >= today) {
          upcoming.push(base);
        } else if (!reviewedScheduledIds.has(d.id)) {
          // Past scheduled lesson with NO lesson_history row — surface it as
          // "pending review" so it never silently disappears from the pupil
          // record. Previously these were dropped entirely.
          pendingReview.push({ ...base, status: "pending_review" });
        }
        // Else: past, has matching lesson_history — already in `completed`.
      }

      const sortDesc = (a: PupilLessonHistoryEntry, b: PupilLessonHistoryEntry) => {
        const da = `${a.lesson_date} ${a.start_time ?? ""}`;
        const db = `${b.lesson_date} ${b.start_time ?? ""}`;
        return db.localeCompare(da);
      };
      // upcoming should be ascending (soonest first)
      upcoming.sort((a, b) => -sortDesc(a, b));
      completed.sort(sortDesc);
      pendingReview.sort(sortDesc);
      cancelled.sort(sortDesc);

      // pending_review rows are part of the past timeline — interleave them
      // with completed by date so the lessons tab shows the full history.
      const past = [...completed, ...pendingReview].sort(sortDesc);

      return includeUpcoming
        ? [...upcoming, ...past, ...cancelled]
        : [...past, ...cancelled];

    },
    enabled: !!pupilId,
    staleTime: 60_000,
  });
}
