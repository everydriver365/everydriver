import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";

interface GapSuggestion {
  date: string;
  durationMinutes: number;
  suggestedPupils: Array<{ id: string; name: string; phone: string | null; isWaitlisted: boolean }>;
}

export function useGapSuggestions(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["gap-suggestions", instructorId],
    queryFn: async (): Promise<GapSuggestion[]> => {
      if (!instructorId) return [];
      const today = format(new Date(), "yyyy-MM-dd");
      const nextWeek = format(addDays(new Date(), 7), "yyyy-MM-dd");

      const { data: lessons } = await (supabase.from("scheduled_lessons") as any).select("lesson_date").eq("instructor_id", instructorId).gte("lesson_date", today).lte("lesson_date", nextWeek).neq("status", "cancelled");
      const { data: pupils } = await (supabase.from("pupils") as any).select("id, name, phone").eq("instructor_id", instructorId).eq("is_active", true).limit(5);

      const lessonsByDate = new Map<string, number>();
      (lessons || []).forEach((l: any) => lessonsByDate.set(l.lesson_date, (lessonsByDate.get(l.lesson_date) || 0) + 1));

      const gaps: GapSuggestion[] = [];
      for (let i = 1; i <= 7 && gaps.length < 3; i++) {
        const date = format(addDays(new Date(), i), "yyyy-MM-dd");
        const count = lessonsByDate.get(date) || 0;
        if (count < 4) {
          gaps.push({ date, durationMinutes: (4 - count) * 60, suggestedPupils: (pupils || []).map((p: any) => ({ id: p.id, name: p.name, phone: p.phone, isWaitlisted: false })) });
        }
      }
      return gaps;
    },
    enabled: !!instructorId,
    staleTime: 10 * 60 * 1000,
  });
}
