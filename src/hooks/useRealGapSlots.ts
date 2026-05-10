import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay, parseISO } from "date-fns";
import {
  buildDayConflicts,
  computeFreeSlots,
  fromMinutes,
  toMinutes,
} from "@/lib/availabilityCore";

interface GapSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface SuggestedPupil {
  id: string;
  name: string;
  phone: string | null;
  postcode?: string | null;
  isWaitlisted: boolean;
}

interface RealGapSuggestion {
  date: string;
  formattedDate: string;
  slots: GapSlot[];
  suggestedPupils: SuggestedPupil[];
}

export function useRealGapSlots(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["real-gap-slots", instructorId],
    queryFn: async (): Promise<RealGapSuggestion[]> => {
      if (!instructorId) return [];

      const today = format(new Date(), "yyyy-MM-dd");
      const twoWeeksLater = format(addDays(new Date(), 14), "yyyy-MM-dd");
      const todayISO = new Date().toISOString();
      const twoWeeksISO = addDays(new Date(), 14).toISOString();

      // Fetch all data in parallel
      const [
        { data: workingHours },
        { data: scheduledLessons },
        { data: overrides },
        { data: manualBlocks },
        { data: calendarEvents },
        { data: pupils },
        { data: instructor },
      ] = await Promise.all([
        supabase
          .from("instructor_working_hours")
          .select("*")
          .eq("instructor_id", instructorId)
          .eq("is_active", true),
        supabase
          .from("scheduled_lessons")
          .select("lesson_date, start_time, duration_minutes, pupil:pupils(travel_time_minutes)")
          .eq("instructor_id", instructorId)
          .gte("lesson_date", today)
          .lte("lesson_date", twoWeeksLater)
          .neq("status", "cancelled"),
        supabase
          .from("instructor_date_overrides")
          .select("*")
          .eq("instructor_id", instructorId)
          .gte("override_date", today),
        supabase
          .from("instructor_manual_blocks")
          .select("start_datetime, end_datetime")
          .eq("instructor_id", instructorId)
          .gte("end_datetime", todayISO)
          .lte("start_datetime", twoWeeksISO),
        supabase
          .from("instructor_calendar_events")
          .select("start_time, end_time, is_busy")
          .eq("instructor_id", instructorId)
          .eq("is_busy", true)
          .gte("end_time", todayISO)
          .lte("start_time", twoWeeksISO),
        supabase
          .from("pupils")
          .select("id, name, phone, postcode")
          .eq("instructor_id", instructorId)
          .eq("status", "active")
          .not("phone", "is", null)
          .limit(10),
        supabase
          .from("instructors")
          .select("buffer_minutes")
          .eq("id", instructorId)
          .maybeSingle(),
      ]);

      const bufferMinutes =
        (instructor as { buffer_minutes?: number | null } | null)?.buffer_minutes ?? 0;

      const suggestedPupils: SuggestedPupil[] = (pupils || []).map((p) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        postcode: p.postcode,
        isWaitlisted: false,
      }));

      const gapsByDate: Map<string, GapSlot[]> = new Map();

      for (let i = 1; i <= 14; i++) {
        const currentDate = addDays(startOfDay(new Date()), i);
        const dateStr = format(currentDate, "yyyy-MM-dd");
        const dayOfWeek = currentDate.getDay();

        const override = overrides?.find((o) => o.override_date === dateStr);
        if (override && !override.is_available) continue;

        const dayHours = workingHours?.find((wh) => wh.day_of_week === dayOfWeek);
        if (!dayHours && !override?.is_available) continue;

        const startHour = override?.start_time || dayHours?.start_time || "09:00";
        const endHour = override?.end_time || dayHours?.end_time || "17:00";

        const dayLessons = (scheduledLessons || []).filter(
          (l) => l.lesson_date === dateStr,
        );
        const dayBlocks = manualBlocks || [];
        const dayEvents = calendarEvents || [];

        const conflicts = buildDayConflicts(
          dateStr,
          dayLessons,
          dayBlocks,
          dayEvents,
        );

        const free = computeFreeSlots({
          dateStr,
          dayStartMin: toMinutes(startHour),
          dayEndMin: toMinutes(endHour),
          bufferMinutes,
          durationMinutes: 60,
          conflicts,
          anchorSkipMinutes: 60,
        });

        const daySlots: GapSlot[] = free.map((slot) => ({
          id: `${dateStr}-${fromMinutes(slot.start)}`,
          date: dateStr,
          startTime: fromMinutes(slot.start),
          endTime: fromMinutes(slot.end),
        }));

        if (daySlots.length > 0) gapsByDate.set(dateStr, daySlots);
      }

      // Convert to array format and limit to first 7 days with gaps
      const result: RealGapSuggestion[] = [];
      for (const [date, slots] of gapsByDate) {
        if (result.length >= 7) break;
        result.push({
          date,
          formattedDate: format(parseISO(date), "EEE d MMM"),
          slots,
          suggestedPupils,
        });
      }

      return result;
    },
    enabled: !!instructorId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
