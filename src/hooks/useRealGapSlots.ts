import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay, parseISO } from "date-fns";
import {
  loadCourseAvailabilitySources,
  computeDaySlots,
  type InstructorLite,
} from "@/lib/courseAvailability";
import { fromMinutes } from "@/lib/availabilityEngine";

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

/**
 * Find real gap slots for an instructor over the next 14 days.
 *
 * UNIFIED ENGINE: Delegates all slot generation to `computeDaySlots` — the
 * same engine used by the public booking page, /courses discovery,
 * auto-scheduler and the create-booking guard.
 *
 * BUSYNESS SOURCE: Google Calendar + manual blocks only (loaded via
 * `loadCourseAvailabilitySources`). `scheduled_lessons` is CRM data and is
 * NEVER consulted for availability.
 */
export function useRealGapSlots(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["real-gap-slots", instructorId],
    queryFn: async (): Promise<RealGapSuggestion[]> => {
      if (!instructorId) return [];

      const fromDate = startOfDay(new Date());
      const toDate = addDays(fromDate, 14);

      const [instructorRes, pupilsRes, sources] = await Promise.all([
        supabase
          .from("instructors")
          .select("id, available_from, buffer_minutes, slot_increment_minutes, is_network_placeholder")
          .eq("id", instructorId)
          .maybeSingle(),
        supabase
          .from("pupils")
          .select("id, name, phone, postcode")
          .eq("instructor_id", instructorId)
          .eq("status", "active")
          .not("phone", "is", null)
          .limit(10),
        loadCourseAvailabilitySources(supabase, [instructorId], fromDate, toDate),
      ]);

      const row = (instructorRes.data || { id: instructorId }) as any;
      const instructor: InstructorLite = {
        id: instructorId,
        available_from: row.available_from ?? null,
        buffer_minutes: row.buffer_minutes ?? 0,
        is_network_placeholder: row.is_network_placeholder ?? false,
      };
      const slotIncrement = row.slot_increment_minutes ?? 60;
      const buffer = row.buffer_minutes ?? 0;

      const suggestedPupils: SuggestedPupil[] = (pupilsRes.data || []).map((p) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        postcode: p.postcode,
        isWaitlisted: false,
      }));

      const result: RealGapSuggestion[] = [];

      for (let i = 1; i <= 14; i++) {
        if (result.length >= 7) break;
        const day = addDays(fromDate, i);
        const dateStr = format(day, "yyyy-MM-dd");

        const { slots } = computeDaySlots(instructor, day, sources, {
          durationMinutes: 60,
          bufferMinutes: buffer,
          slotIncrementMinutes: slotIncrement,
        });

        if (slots.length === 0) continue;

        result.push({
          date: dateStr,
          formattedDate: format(parseISO(dateStr), "EEE d MMM"),
          slots: slots.map((s) => ({
            id: `${dateStr}-${fromMinutes(s.start)}`,
            date: dateStr,
            startTime: fromMinutes(s.start),
            endTime: fromMinutes(s.end),
          })),
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
