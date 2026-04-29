import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface TodayLesson {
  id: string;
  pupilId: string;
  pupilName: string;
  pupilInitials: string;
  pupilProfileImageUrl: string | null;
  startTime: string;
  durationMinutes: number;
  pickupPostcode: string | null;
  pickupLocation: string | null;
  lessonType: string;
  paymentStatus: string;
  amountDue: number | null;
  status: string;
  googleEventId?: string | null;
  notes?: string | null;
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
          id, pupil_id, start_time, duration_minutes, pickup_postcode, pickup_location, status, lesson_type, payment_status, amount_due, google_event_id, notes,
          pupils!inner (id, name, postcode, address, profile_image_url)
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
          pupilId: l.pupil_id || pupil?.id || "",
          pupilName: name,
          pupilInitials: initials,
          pupilProfileImageUrl: pupil?.profile_image_url || null,
          startTime: l.start_time,
          durationMinutes: l.duration_minutes || 60,
          pickupPostcode: l.pickup_postcode || pupil?.postcode || null,
          pickupLocation: l.pickup_location || pupil?.address || null,
          lessonType: l.lesson_type || "Standard",
          paymentStatus: l.payment_status || "unpaid",
          amountDue: l.amount_due ?? null,
          status: l.status || "scheduled",
          googleEventId: (l as any).google_event_id ?? null,
        };
      });
    },
    enabled: !!instructorId,
    staleTime: 15 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}
