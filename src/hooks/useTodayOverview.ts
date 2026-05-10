import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { computeLessonAmount } from "@/lib/pricing/resolveHourlyRate";
import { fetchInstructorPostcodeRules } from "@/hooks/useInstructorPostcodeRules";


interface TodayOverview {
  lessonCount: number;
  completedCount: number;
  totalHours: number;
  expectedEarnings: number;
  firstPickupLocation: string | null;
  firstPickupPostcode: string | null;
  firstLessonTime: string | null;
  firstPupilName: string | null;
  firstPupilId: string | null;
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
          lessonCount: 0, completedCount: 0, totalHours: 0, expectedEarnings: 0,
          firstPickupLocation: null, firstPickupPostcode: null, firstLessonTime: null,
          firstPupilName: null, firstPupilId: null, nextLessonTime: null, nextPupilName: null,
        };
      }

      const { data: lessons, error: lessonsError } = await supabase
        .from("scheduled_lessons")
        .select(`id, pupil_id, start_time, duration_minutes, pickup_location, pickup_postcode, status, pupils!inner (name, postcode, address)`)
        .eq("instructor_id", instructorId)
        .eq("lesson_date", today)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true });

      if (lessonsError) throw lessonsError;

      const { data: instructor, error: instructorError } = await supabase
        .from("instructors").select("hourly_rate").eq("id", instructorId).maybeSingle();
      if (instructorError) throw instructorError;

      const hourlyRate = instructor?.hourly_rate || 35;
      const lessonCount = lessons?.length || 0;
      const completedCount = lessons?.filter(l => l.status === 'completed')?.length || 0;
      const totalMinutes = lessons?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0;
      const totalHours = totalMinutes / 60;
      const expectedEarnings = totalHours * hourlyRate;

      const firstLesson = lessons?.[0];
      const firstPickupLocation = firstLesson?.pickup_location || (firstLesson?.pupils as any)?.address || null;
      const rawPostcode = firstLesson?.pickup_postcode || (firstLesson?.pupils as any)?.postcode || null;
      const firstPickupPostcode = rawPostcode && rawPostcode.toLowerCase() !== 'n/a' ? rawPostcode : null;
      const firstLessonTime = firstLesson?.start_time || null;
      const firstPupilName = (firstLesson?.pupils as any)?.name || null;
      const firstPupilId = (firstLesson as any)?.pupil_id || null;

      const upcomingLessons = lessons?.filter(l => l.start_time && l.start_time > currentTime) || [];
      const nextLesson = upcomingLessons[0];

      return {
        lessonCount,
        completedCount,
        totalHours: Math.round(totalHours * 10) / 10,
        expectedEarnings: Math.round(expectedEarnings),
        firstPickupLocation,
        firstPickupPostcode,
        firstLessonTime,
        firstPupilName,
        firstPupilId,
        nextLessonTime: nextLesson?.start_time || null,
        nextPupilName: (nextLesson?.pupils as any)?.name || null,
      };
    },
    enabled: !!instructorId,
    staleTime: 15 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}
