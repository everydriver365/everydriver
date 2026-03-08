import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parse, addMinutes, isBefore } from "date-fns";

export interface OverdueLesson {
  id: string;
  pupilId: string;
  pupilName: string;
  startTime: string;
  durationMinutes: number;
  lessonDate: string;
  currentBalance: number;
}

export function useLessonEndAlert(instructorId: string | undefined) {
  const [overdueLesson, setOverdueLesson] = useState<OverdueLesson | null>(null);
  const dismissedIdsRef = useRef<Set<string>>(new Set());

  const checkLessons = useCallback(async () => {
    if (!instructorId) return;

    const today = format(new Date(), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("scheduled_lessons")
      .select(`
        id, pupil_id, start_time, duration_minutes, lesson_date,
        pupils!inner(id, name, account_balance)
      `)
      .eq("instructor_id", instructorId)
      .eq("lesson_date", today)
      .in("status", ["scheduled", "in_progress", "arrived"])
      .order("start_time", { ascending: true });

    if (error || !data) return;

    const now = new Date();

    for (const lesson of data) {
      if (dismissedIdsRef.current.has(lesson.id)) continue;
      if (!lesson.start_time || !lesson.duration_minutes) continue;

      const startDate = parse(lesson.start_time, "HH:mm:ss", new Date());
      const endDate = addMinutes(startDate, lesson.duration_minutes);

      if (isBefore(endDate, now)) {
        const pupil = (lesson as any).pupils;
        setOverdueLesson({
          id: lesson.id,
          pupilId: lesson.pupil_id || pupil?.id || "",
          pupilName: pupil?.name || "Unknown",
          startTime: lesson.start_time,
          durationMinutes: lesson.duration_minutes,
          lessonDate: lesson.lesson_date || today,
          currentBalance: pupil?.account_balance ?? 0,
        });
        return;
      }
    }

    setOverdueLesson(null);
  }, [instructorId]);

  useEffect(() => {
    checkLessons();
    const interval = setInterval(checkLessons, 30_000);
    return () => clearInterval(interval);
  }, [checkLessons]);

  const dismiss = useCallback((lessonId: string) => {
    dismissedIdsRef.current.add(lessonId);
    setOverdueLesson(null);
  }, []);

  return { overdueLesson, dismiss };
}
