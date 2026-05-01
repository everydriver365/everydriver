import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInMinutes } from "date-fns";

interface NextLessonDetails {
  lessonId: string;
  pupilId: string;
  pupilName: string;
  pupilPhone: string | null;
  pupilProfileImage: string | null;
  pickupPostcode: string | null;
  pickupLocation: string | null;
  lessonDate: string;
  startTime: string;
  minutesUntil: number;
  durationMinutes: number;
  accountBalance: number;
  prepaidHours: number;
  checkInStatus: string | null;
  lessonStatus: string | null;
  lastLessonPlan: string | null;
}

export function useNextLessonDetails(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["next-lesson-details", instructorId],
    queryFn: async (): Promise<NextLessonDetails | null> => {
      if (!instructorId) return null;

      const now = new Date();
      const today = format(now, "yyyy-MM-dd");

      // Pull all of today's non-cancelled, non-completed lessons and pick the
      // earliest one that has not yet finished (start + duration is still in
      // the future). This keeps an in-progress lesson surfaced as "next" until
      // it actually ends, instead of jumping ahead to a lesson days away the
      // moment its start time passes.
      const { data: todayLessons } = await supabase
        .from("scheduled_lessons")
        .select(`id, lesson_date, start_time, duration_minutes, pickup_location, pickup_postcode, check_in_status, status, pupils!inner (id, name, phone, profile_image_url, postcode, address, pickup_address, pickup_postcode, account_balance, prepaid_hours)`)
        .eq("instructor_id", instructorId)
        .eq("lesson_date", today)
        .neq("status", "cancelled")
        .neq("status", "completed")
        .order("start_time", { ascending: true });

      const todayLesson = (todayLessons || []).find((l: any) => {
        const start = new Date(`${l.lesson_date}T${l.start_time}`);
        const end = new Date(start.getTime() + (l.duration_minutes || 60) * 60000);
        return end.getTime() > now.getTime();
      }) || null;

      let lesson = todayLesson;
      if (!lesson) {
        const { data: futureLesson } = await supabase
          .from("scheduled_lessons")
          .select(`id, lesson_date, start_time, duration_minutes, pickup_location, pickup_postcode, check_in_status, status, pupils!inner (id, name, phone, profile_image_url, postcode, address, pickup_address, pickup_postcode, account_balance, prepaid_hours)`)
          .eq("instructor_id", instructorId)
          .gt("lesson_date", today)
          .neq("status", "cancelled")
          .order("lesson_date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(1)
          .maybeSingle();
        lesson = futureLesson;
      }

      if (!lesson) return null;

      const pupil = (lesson as any).pupils;
      const lessonDate = (lesson as any).lesson_date;
      const lessonTime = new Date(`${lessonDate}T${lesson.start_time}`);
      const minutesUntil = differenceInMinutes(lessonTime, now);
      const effectivePostcode = pupil.pickup_postcode || pupil.postcode || null;
      const effectiveLocation = pupil.pickup_address || pupil.address || null;

      let lastLessonPlan: string | null = null;
      const { data: lastReview } = await supabase
        .from("lesson_history")
        .select("next_lesson_plan")
        .eq("instructor_id", instructorId)
        .eq("pupil_id", pupil.id)
        .not("next_lesson_plan", "is", null)
        .order("lesson_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastReview?.next_lesson_plan) lastLessonPlan = lastReview.next_lesson_plan;

      return {
        lessonId: lesson.id, pupilId: pupil.id, pupilName: pupil.name,
        pupilPhone: pupil.phone, pupilProfileImage: pupil.profile_image_url,
        pickupPostcode: effectivePostcode, pickupLocation: effectiveLocation,
        lessonDate, startTime: lesson.start_time,
        minutesUntil: Math.max(0, minutesUntil),
        durationMinutes: lesson.duration_minutes || 60,
        accountBalance: pupil.account_balance || 0,
        prepaidHours: pupil.prepaid_hours || 0,
        checkInStatus: (lesson as any).check_in_status || null,
        lastLessonPlan,
      };
    },
    enabled: !!instructorId,
    staleTime: 0,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
