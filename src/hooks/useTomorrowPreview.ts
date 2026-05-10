import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
import { computeLessonAmount } from "@/lib/pricing/resolveHourlyRate";
import { fetchInstructorPostcodeRules } from "@/hooks/useInstructorPostcodeRules";


interface TomorrowLesson {
  id: string;
  pupilName: string;
  pupilPhone: string | null;
  pickupPostcode: string | null;
  startTime: string;
  durationMinutes: number;
}

interface TomorrowPreviewData {
  lessonCount: number;
  totalHours: number;
  expectedEarnings: number;
  firstLessonTime: string | null;
  lastLessonTime: string | null;
  lessons: TomorrowLesson[];
  hasGaps: boolean;
}

export function useTomorrowPreview(instructorId: string | undefined) {
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["tomorrow-preview", instructorId, tomorrow],
    queryFn: async (): Promise<TomorrowPreviewData> => {
      if (!instructorId) {
        return { lessonCount: 0, totalHours: 0, expectedEarnings: 0, firstLessonTime: null, lastLessonTime: null, lessons: [], hasGaps: false };
      }

      const { data: lessons, error } = await supabase
        .from("scheduled_lessons")
        .select(`id, start_time, duration_minutes, pickup_postcode, pupils!inner (name, phone, postcode)`)
        .eq("instructor_id", instructorId)
        .eq("lesson_date", tomorrow)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true });

      if (error) throw error;

      const { data: instructor } = await supabase
        .from("instructors").select("hourly_rate").eq("id", instructorId).maybeSingle();

      const hourlyRate = instructor?.hourly_rate || 35;
      const totalMinutes = lessons?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0;
      const totalHours = totalMinutes / 60;

      let hasGaps = false;
      if (lessons && lessons.length > 1) {
        for (let i = 1; i < lessons.length; i++) {
          const prevEnd = addMinutesToTime(lessons[i - 1].start_time, lessons[i - 1].duration_minutes || 60);
          const currStart = lessons[i].start_time;
          if (getMinutesDifference(prevEnd, currStart) > 60) { hasGaps = true; break; }
        }
      }

      return {
        lessonCount: lessons?.length || 0,
        totalHours: Math.round(totalHours * 10) / 10,
        expectedEarnings: Math.round(totalHours * hourlyRate),
        firstLessonTime: lessons?.[0]?.start_time || null,
        lastLessonTime: lessons?.[lessons.length - 1]?.start_time || null,
        lessons: lessons?.map(l => ({
          id: l.id,
          pupilName: (l.pupils as any).name,
          pupilPhone: (l.pupils as any).phone,
          pickupPostcode: l.pickup_postcode || (l.pupils as any).postcode,
          startTime: l.start_time,
          durationMinutes: l.duration_minutes || 60,
        })) || [],
        hasGaps,
      };
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}:00`;
}

function getMinutesDifference(time1: string, time2: string): number {
  const [h1, m1] = time1.split(":").map(Number);
  const [h2, m2] = time2.split(":").map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}
