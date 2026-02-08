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
}

export function useNextLessonDetails(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["next-lesson-details", instructorId],
    queryFn: async (): Promise<NextLessonDetails | null> => {
      if (!instructorId) return null;

      // Compute fresh timestamps at query execution time
      const now = new Date();
      const today = format(now, "yyyy-MM-dd");
      const currentTime = format(now, "HH:mm:ss");

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
      
      const lessonTime = new Date(`${lessonDate}T${lesson.start_time}`);
      const minutesUntil = differenceInMinutes(lessonTime, now);

      // Use pupil's current address as the canonical source;
      // only use lesson-level pickup fields if they meaningfully differ
      // (i.e. a custom pickup was explicitly set that isn't the pupil's home)
      const pupilPostcode = pupil.postcode || null;
      const pupilAddress = pupil.address || null;
      const lessonPickupPostcode = lesson.pickup_postcode || null;
      const lessonPickupLocation = lesson.pickup_location || null;

      // If the lesson pickup matches the pupil home, prefer the (possibly updated) pupil data
      const isPickupSameAsHome =
        !lessonPickupPostcode ||
        lessonPickupPostcode === pupilPostcode ||
        lessonPickupLocation === pupilAddress;

      const effectivePostcode = isPickupSameAsHome ? pupilPostcode : lessonPickupPostcode;
      const effectiveLocation = isPickupSameAsHome ? pupilAddress : lessonPickupLocation;

      return {
        lessonId: lesson.id,
        pupilId: pupil.id,
        pupilName: pupil.name,
        pupilPhone: pupil.phone,
        pupilProfileImage: pupil.profile_image_url,
        pickupPostcode: effectivePostcode,
        pickupLocation: effectiveLocation,
        lessonDate,
        startTime: lesson.start_time,
        minutesUntil: Math.max(0, minutesUntil),
        durationMinutes: lesson.duration_minutes || 60,
        accountBalance: pupil.account_balance || 0,
        prepaidHours: pupil.prepaid_hours || 0,
      };
    },
    enabled: !!instructorId,
    staleTime: 0,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
