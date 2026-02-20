import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface TodayLesson {
  id: string;
  pupilName: string;
  pupilInitials: string;
  startTime: string;
  durationMinutes: number;
  pickupPostcode: string | null;
  status: string;
  lessonType: string;
  paymentStatus: string;
  amountDue: number | null;
}

export function useTodayRemainingLessons(instructorId: string | undefined) {
  const today = format(new Date(), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["today-remaining-lessons", instructorId, today],
    queryFn: async (): Promise<TodayLesson[]> => {
      if (!instructorId) return [];

      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select(`
          id, start_time, duration_minutes, pickup_postcode, status,
          lesson_type, payment_status, amount_due,
          pupils!inner (name, postcode)
        `)
        .eq("instructor_id", instructorId)
        .eq("lesson_date", today)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true });

      if (error) throw error;

      return (data || []).map((l) => {
        const pupil = (l as any).pupils;
        const name: string = pupil?.name || "Unknown";
        const initials = name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase();
        return {
          id: l.id,
          pupilName: name,
          pupilInitials: initials,
          startTime: l.start_time,
          durationMinutes: l.duration_minutes || 60,
          pickupPostcode: l.pickup_postcode || pupil?.postcode || null,
          status: l.status || "scheduled",
          lessonType: l.lesson_type || "standard",
          paymentStatus: l.payment_status || "unpaid",
          amountDue: l.amount_due,
        };
      });
    },
    enabled: !!instructorId,
    staleTime: 2 * 60 * 1000,
  });
}
