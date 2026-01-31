import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface TodayOverview {
  lessonCount: number;
  totalHours: number;
  expectedEarnings: number;
  firstPickupLocation: string | null;
  firstPickupPostcode: string | null;
  firstLessonTime: string | null;
  nextLessonTime: string | null;
  nextPupilName: string | null;
}

export function useTodayOverview(instructorId: string | undefined) {
  const today = format(new Date(), "yyyy-MM-dd");
  const currentTime = format(new Date(), "HH:mm:ss");

  return useQuery({
    queryKey: ["today-overview", instructorId, today],
    queryFn: async (): Promise<TodayOverview> => {
      if (!instructorId) {
        return {
          lessonCount: 0,
          totalHours: 0,
          expectedEarnings: 0,
          firstPickupLocation: null,
          firstPickupPostcode: null,
          firstLessonTime: null,
          nextLessonTime: null,
          nextPupilName: null,
        };
      }

      // Fetch today's lessons with pupil info using lesson_date (DATE type)
      const { data: lessons, error: lessonsError } = await supabase
        .from("scheduled_lessons")
        .select(`
          id,
          start_time,
          duration_minutes,
          pickup_location,
          pickup_postcode,
          status,
          pupils!inner (
            name,
            postcode,
            address
          )
        `)
        .eq("instructor_id", instructorId)
        .eq("lesson_date", today)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true });

      if (lessonsError) throw lessonsError;

      // Fetch instructor's hourly rate
      const { data: instructor, error: instructorError } = await supabase
        .from("instructors")
        .select("hourly_rate")
        .eq("id", instructorId)
        .maybeSingle();

      if (instructorError) throw instructorError;

      const hourlyRate = instructor?.hourly_rate || 35; // Default £35/hour
      const lessonCount = lessons?.length || 0;
      const totalMinutes = lessons?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0;
      const totalHours = totalMinutes / 60;
      const expectedEarnings = totalHours * hourlyRate;

      // Get first lesson's pickup info
      const firstLesson = lessons?.[0];
      const firstPickupLocation = firstLesson?.pickup_location || 
        (firstLesson?.pupils as any)?.address || null;
      const firstPickupPostcode = firstLesson?.pickup_postcode || 
        (firstLesson?.pupils as any)?.postcode || null;
      const firstLessonTime = firstLesson?.start_time || null;

      // Find next upcoming lesson (after current time)
      const upcomingLessons = lessons?.filter(l => l.start_time && l.start_time > currentTime) || [];
      const nextLesson = upcomingLessons[0];
      const nextLessonTime = nextLesson?.start_time || null;
      const nextPupilName = (nextLesson?.pupils as any)?.name || null;

      return {
        lessonCount,
        totalHours: Math.round(totalHours * 10) / 10,
        expectedEarnings: Math.round(expectedEarnings),
        firstPickupLocation,
        firstPickupPostcode,
        firstLessonTime,
        nextLessonTime,
        nextPupilName,
      };
    },
    enabled: !!instructorId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
