import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay, parseISO } from "date-fns";

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
          .select("lesson_date, start_time, duration_minutes")
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
      const TRAVEL_FALLBACK_MIN = 10;
      // Hours of allowance to inflate conflict windows by on each side
      const sideAllowanceHours = (bufferMinutes + TRAVEL_FALLBACK_MIN) / 60;

      // Map pupils to suggested format
      const suggestedPupils: SuggestedPupil[] = (pupils || []).map((p) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        postcode: p.postcode,
        isWaitlisted: false,
      }));

      const gapsByDate: Map<string, GapSlot[]> = new Map();

      // Calculate gaps for each day
      for (let i = 1; i <= 14; i++) {
        const currentDate = addDays(startOfDay(new Date()), i);
        const dateStr = format(currentDate, "yyyy-MM-dd");
        const dayOfWeek = currentDate.getDay();

        // Check if there's an override for this date
        const override = overrides?.find((o) => o.override_date === dateStr);

        if (override && !override.is_available) {
          continue; // Instructor marked as unavailable
        }

        // Get working hours for this day
        const dayHours = workingHours?.find((wh) => wh.day_of_week === dayOfWeek);

        if (!dayHours && !override?.is_available) {
          continue; // No working hours set for this day
        }

        const startHour = override?.start_time || dayHours?.start_time || "09:00";
        const endHour = override?.end_time || dayHours?.end_time || "17:00";

        // Get lessons for this day
        const dayLessons = scheduledLessons?.filter((l) => l.lesson_date === dateStr) || [];

        // Get manual blocks for this day
        const dayBlocks =
          manualBlocks?.filter((b) => {
            const blockStart = new Date(b.start_datetime);
            const blockEnd = new Date(b.end_datetime);
            return (
              format(blockStart, "yyyy-MM-dd") === dateStr ||
              format(blockEnd, "yyyy-MM-dd") === dateStr
            );
          }) || [];

        // Get external calendar events for this day
        const dayCalendarEvents =
          calendarEvents?.filter((e) => {
            const eventStart = new Date(e.start_time);
            const eventEnd = new Date(e.end_time);
            return (
              format(eventStart, "yyyy-MM-dd") === dateStr ||
              format(eventEnd, "yyyy-MM-dd") === dateStr
            );
          }) || [];

        // Parse working hours
        const workStart = parseInt(startHour.split(":")[0]);
        const workEnd = parseInt(endHour.split(":")[0]);

        const daySlots: GapSlot[] = [];

        // Find 1-hour slots that are free
        for (let hour = workStart; hour < workEnd; hour++) {
          const slotStart = `${hour.toString().padStart(2, "0")}:00`;
          const slotEnd = `${(hour + 1).toString().padStart(2, "0")}:00`;
          const slotStartHour = hour;
          const slotEndHour = hour + 1;

          // Inflate every conflict window by buffer + travel on each side
          // so we don't offer a slot that touches another commitment.
          const pad = sideAllowanceHours;

          // Check if this slot overlaps with any scheduled lesson
          const hasLessonConflict = dayLessons.some((lesson) => {
            const [lh, lm] = lesson.start_time.split(":").map(Number);
            const lessonStartHour = lh + (lm || 0) / 60;
            const lessonEndHour = lessonStartHour + lesson.duration_minutes / 60;
            return (
              slotStartHour < lessonEndHour + pad &&
              slotEndHour > lessonStartHour - pad
            );
          });

          // Check if this slot overlaps with any manual block
          const hasBlockConflict = dayBlocks.some((block) => {
            const blockStart = new Date(block.start_datetime);
            const blockEnd = new Date(block.end_datetime);

            if (format(blockStart, "yyyy-MM-dd") === dateStr) {
              const blockStartHour = blockStart.getHours() + blockStart.getMinutes() / 60;
              const blockEndHour = blockEnd.getHours() + blockEnd.getMinutes() / 60;
              return (
                slotStartHour < blockEndHour + pad &&
                slotEndHour > blockStartHour - pad
              );
            }
            return false;
          });

          // Check if this slot overlaps with any external calendar event
          const hasCalendarConflict = dayCalendarEvents.some((event) => {
            const eventStart = new Date(event.start_time);
            const eventEnd = new Date(event.end_time);

            if (format(eventStart, "yyyy-MM-dd") === dateStr) {
              const eventStartHour = eventStart.getHours() + eventStart.getMinutes() / 60;
              const eventEndHour = eventEnd.getHours() + eventEnd.getMinutes() / 60;
              return (
                slotStartHour < eventEndHour + pad &&
                slotEndHour > eventStartHour - pad
              );
            }
            return false;
          });

          if (!hasLessonConflict && !hasBlockConflict && !hasCalendarConflict) {
            daySlots.push({
              id: `${dateStr}-${slotStart}`,
              date: dateStr,
              startTime: slotStart,
              endTime: slotEnd,
            });
          }
        }

        if (daySlots.length > 0) {
          gapsByDate.set(dateStr, daySlots);
        }
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
