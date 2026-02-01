import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";

interface GapSuggestion {
  date: string;
  durationMinutes: number;
  suggestedPupils: Array<{ id: string; name: string; phone: string | null; postcode?: string | null; isWaitlisted: boolean }>;
}

export function useGapSuggestions(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["gap-suggestions", instructorId],
    queryFn: async (): Promise<GapSuggestion[]> => {
      if (!instructorId) return [];
      
      const today = format(new Date(), "yyyy-MM-dd");
      const nextWeek = format(addDays(new Date(), 7), "yyyy-MM-dd");

      // Get scheduled lessons for the next 7 days
      const { data: lessons, error: lessonsError } = await supabase
        .from("scheduled_lessons")
        .select("lesson_date")
        .eq("instructor_id", instructorId)
        .gte("lesson_date", today)
        .lte("lesson_date", nextWeek)
        .neq("status", "cancelled");

      if (lessonsError) {
        console.error("Error fetching lessons for gaps:", lessonsError);
      }

      // Get active pupils with phone numbers for suggestions
      const { data: pupils, error: pupilsError } = await supabase
        .from("pupils")
        .select("id, name, phone, postcode")
        .eq("instructor_id", instructorId)
        .eq("status", "active")
        .not("phone", "is", null)
        .limit(5);

      if (pupilsError) {
        console.error("Error fetching pupils for gaps:", pupilsError);
      }

      // Count lessons per date
      const lessonsByDate = new Map<string, number>();
      (lessons || []).forEach((l) => {
        lessonsByDate.set(l.lesson_date, (lessonsByDate.get(l.lesson_date) || 0) + 1);
      });

      // Map pupils to suggested format
      const suggestedPupils = (pupils || []).map((p) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        postcode: p.postcode,
        isWaitlisted: false,
      }));

      // Find gaps (days with fewer than 4 lessons)
      const gaps: GapSuggestion[] = [];
      for (let i = 1; i <= 7 && gaps.length < 3; i++) {
        const date = format(addDays(new Date(), i), "yyyy-MM-dd");
        const count = lessonsByDate.get(date) || 0;
        
        // Consider it a gap if fewer than 4 lessons scheduled
        if (count < 4 && suggestedPupils.length > 0) {
          gaps.push({
            date,
            durationMinutes: (4 - count) * 60,
            suggestedPupils: suggestedPupils.slice(0, 5),
          });
        }
      }

      return gaps;
    },
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
