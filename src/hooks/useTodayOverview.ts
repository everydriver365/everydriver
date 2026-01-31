import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay } from "date-fns";

interface TodayOverview {
  lessonCount: number;
  totalHours: number;
  expectedEarnings: number;
  firstPickupLocation: string | null;
  firstPickupPostcode: string | null;
  firstLessonTime: string | null;
}

export function useTodayOverview(instructorId: string | undefined) {
  const today = format(new Date(), "yyyy-MM-dd");

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
        };
      }

      const startOfToday = startOfDay(new Date()).toISOString();
      const endOfToday = endOfDay(new Date()).toISOString();

      // Fetch today's lessons with pupil info
      const { data: lessons, error: lessonsError } = await supabase
        .from("scheduled_lessons")
        .select(`
          id,
          start_time,
          duration_minutes,
          pickup_location,
          pupils!inner (
            postcode,
            address
          )
        `)
        .eq("instructor_id", instructorId)
        .gte("start_time", startOfToday)
        .lte("start_time", endOfToday)
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

      // Get first lesson's pickup location
      const firstLesson = lessons?.[0];
      const firstPickupLocation = firstLesson?.pickup_location || 
        (firstLesson?.pupils as any)?.address || null;
      const firstPickupPostcode = (firstLesson?.pupils as any)?.postcode || null;
      const firstLessonTime = firstLesson?.start_time || null;

      return {
        lessonCount,
        totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
        expectedEarnings: Math.round(expectedEarnings),
        firstPickupLocation,
        firstPickupPostcode,
        firstLessonTime,
      };
    },
    enabled: !!instructorId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
