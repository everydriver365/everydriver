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
  startTime: string;
  minutesUntil: number;
  durationMinutes: number;
}

export function useNextLessonDetails(instructorId: string | undefined) {
  const today = format(new Date(), "yyyy-MM-dd");
  const currentTime = format(new Date(), "HH:mm:ss");

  return useQuery({
    queryKey: ["next-lesson-details", instructorId, today, currentTime.slice(0, 5)],
    queryFn: async (): Promise<NextLessonDetails | null> => {
      if (!instructorId) return null;

      const { data: lesson, error } = await supabase
        .from("scheduled_lessons")
        .select(`
          id,
          start_time,
          duration_minutes,
          pickup_location,
          pickup_postcode,
          pupils!inner (
            id,
            name,
            phone,
            profile_image_url,
            postcode,
            address
          )
        `)
        .eq("instructor_id", instructorId)
        .eq("lesson_date", today)
        .gt("start_time", currentTime)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error || !lesson) return null;

      const pupil = lesson.pupils as any;
      
      // Calculate minutes until lesson
      const now = new Date();
      const lessonTime = new Date(`${today}T${lesson.start_time}`);
      const minutesUntil = differenceInMinutes(lessonTime, now);

      return {
        lessonId: lesson.id,
        pupilId: pupil.id,
        pupilName: pupil.name,
        pupilPhone: pupil.phone,
        pupilProfileImage: pupil.profile_image_url,
        pickupPostcode: lesson.pickup_postcode || pupil.postcode,
        pickupLocation: lesson.pickup_location || pupil.address,
        startTime: lesson.start_time,
        minutesUntil: Math.max(0, minutesUntil),
        durationMinutes: lesson.duration_minutes || 60,
      };
    },
    enabled: !!instructorId,
    staleTime: 30 * 1000, // 30 seconds for accurate countdown
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}
