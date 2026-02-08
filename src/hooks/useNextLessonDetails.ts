import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInMinutes, parseISO } from "date-fns";

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
}

export function useNextLessonDetails(instructorId: string | undefined) {
  const today = format(new Date(), "yyyy-MM-dd");
  const currentTime = format(new Date(), "HH:mm:ss");

  return useQuery({
    queryKey: ["next-lesson-details", instructorId, today, currentTime.slice(0, 5)],
    queryFn: async (): Promise<NextLessonDetails | null> => {
      if (!instructorId) return null;

      // First try today's remaining lessons
      const { data: todayLesson } = await supabase
        .from("scheduled_lessons")
        .select(`
          id, lesson_date, start_time, duration_minutes,
          pickup_location, pickup_postcode,
          pupils!inner (
            id, name, phone, profile_image_url,
            postcode, address, account_balance, prepaid_hours
          )
        `)
        .eq("instructor_id", instructorId)
        .eq("lesson_date", today)
        .gt("start_time", currentTime)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle();

      // If none today, get the next future lesson
      let lesson = todayLesson;
      if (!lesson) {
        const { data: futureLesson } = await supabase
          .from("scheduled_lessons")
          .select(`
            id, lesson_date, start_time, duration_minutes,
            pickup_location, pickup_postcode,
            pupils!inner (
              id, name, phone, profile_image_url,
              postcode, address, account_balance, prepaid_hours
            )
          `)
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
      
      // Calculate minutes until lesson
      const now = new Date();
      const lessonTime = new Date(`${lessonDate}T${lesson.start_time}`);
      const minutesUntil = differenceInMinutes(lessonTime, now);

      return {
        lessonId: lesson.id,
        pupilId: pupil.id,
        pupilName: pupil.name,
        pupilPhone: pupil.phone,
        pupilProfileImage: pupil.profile_image_url,
        pickupPostcode: lesson.pickup_postcode || pupil.postcode,
        pickupLocation: lesson.pickup_location || pupil.address,
        lessonDate,
        startTime: lesson.start_time,
        minutesUntil: Math.max(0, minutesUntil),
        durationMinutes: lesson.duration_minutes || 60,
        accountBalance: pupil.account_balance || 0,
        prepaidHours: pupil.prepaid_hours || 0,
      };
    },
    enabled: !!instructorId,
    staleTime: 10 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
