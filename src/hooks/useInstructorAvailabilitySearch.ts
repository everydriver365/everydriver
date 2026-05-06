import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay } from "date-fns";
import {
  buildDayConflicts,
  computeFreeSlots,
  fromMinutes,
  toMinutes,
  type TimeOfDay,
} from "@/lib/availabilityCore";

export type { TimeOfDay };

export interface AvailableSlot {
  id: string;
  instructorId: string;
  instructorName: string;
  carType: string | null;
  postcodeArea: string | null;
  date: string;        // yyyy-MM-dd
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  durationMinutes: number;
  sortKey: number;
}

interface SearchParams {
  instructorIds: string[]; // pre-scoped (admin = all, school = school's)
  selectedInstructorId?: string | "all";
  fromDate: string;        // yyyy-MM-dd
  days: number;            // search window
  durationMinutes: number;
  timeOfDay: TimeOfDay;
  postcodePrefix?: string;
  enabled?: boolean;
}

function postcodeArea(pc?: string | null) {
  if (!pc) return null;
  const cleaned = pc.trim().toUpperCase().replace(/\s+/g, " ");
  const part = cleaned.split(" ")[0];
  return part || null;
}

export function useInstructorAvailabilitySearch(params: SearchParams) {
  const {
    instructorIds,
    selectedInstructorId = "all",
    fromDate,
    days,
    durationMinutes,
    timeOfDay,
    postcodePrefix,
    enabled = true,
  } = params;

  return useQuery({
    queryKey: [
      "instructor-availability-search",
      instructorIds.sort().join(","),
      selectedInstructorId,
      fromDate,
      days,
      durationMinutes,
      timeOfDay,
      postcodePrefix || "",
    ],
    enabled: enabled && instructorIds.length > 0,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<AvailableSlot[]> => {
      const targetIds =
        selectedInstructorId && selectedInstructorId !== "all"
          ? [selectedInstructorId]
          : instructorIds;

      if (targetIds.length === 0) return [];

      const fromDateObj = startOfDay(new Date(fromDate));
      const toDateObj = addDays(fromDateObj, days - 1);
      const fromIso = fromDateObj.toISOString();
      const toIso = addDays(toDateObj, 1).toISOString();
      const fromYmd = format(fromDateObj, "yyyy-MM-dd");
      const toYmd = format(toDateObj, "yyyy-MM-dd");

      const [
        instructorsRes,
        workingHoursRes,
        overridesRes,
        lessonsRes,
        blocksRes,
        eventsRes,
      ] = await Promise.all([
        supabase
          .from("instructors")
          .select("id, name, car_type, home_postcode, buffer_minutes")
          .in("id", targetIds),
        supabase
          .from("instructor_working_hours")
          .select("instructor_id, day_of_week, start_time, end_time, is_active")
          .in("instructor_id", targetIds)
          .eq("is_active", true),
        supabase
          .from("instructor_date_overrides")
          .select("instructor_id, override_date, is_available, start_time, end_time")
          .in("instructor_id", targetIds)
          .gte("override_date", fromYmd)
          .lte("override_date", toYmd),
        supabase
          .from("scheduled_lessons")
          .select("instructor_id, lesson_date, start_time, duration_minutes, status")
          .in("instructor_id", targetIds)
          .gte("lesson_date", fromYmd)
          .lte("lesson_date", toYmd)
          .neq("status", "cancelled"),
        supabase
          .from("instructor_manual_blocks")
          .select("instructor_id, start_datetime, end_datetime")
          .in("instructor_id", targetIds)
          .gte("end_datetime", fromIso)
          .lte("start_datetime", toIso),
        supabase
          .from("instructor_calendar_events")
          .select("instructor_id, start_time, end_time, is_busy")
          .in("instructor_id", targetIds)
          .eq("is_busy", true)
          .gte("end_time", fromIso)
          .lte("start_time", toIso),
      ]);

      const instructors = (instructorsRes.data || []).filter((inst) => {
        if (!postcodePrefix) return true;
        const area = postcodeArea(inst.home_postcode);
        return !!area && area.startsWith(postcodePrefix.toUpperCase());
      });

      const workingHours = workingHoursRes.data || [];
      const overrides = overridesRes.data || [];
      const lessons = lessonsRes.data || [];
      const blocks = blocksRes.data || [];
      const events = eventsRes.data || [];

      const results: AvailableSlot[] = [];

      const TRAVEL_FALLBACK_MIN = 10;

      for (const inst of instructors) {
        const instId = inst.id;
        const instName = inst.name;
        const carType = inst.car_type || null;
        const area = postcodeArea(inst.home_postcode);
        const bufferMin = (inst as { buffer_minutes?: number | null }).buffer_minutes ?? 0;
        const padMin = bufferMin + TRAVEL_FALLBACK_MIN;

        for (let d = 0; d < days; d++) {
          const day = addDays(fromDateObj, d);
          const dateStr = format(day, "yyyy-MM-dd");
          const dow = day.getDay();

          const override = overrides.find(
            (o) => o.instructor_id === instId && o.override_date === dateStr,
          );
          if (override && !override.is_available) continue;

          const wh = workingHours.find(
            (w) => w.instructor_id === instId && w.day_of_week === dow,
          );
          const startStr = override?.start_time || wh?.start_time;
          const endStr = override?.end_time || wh?.end_time;
          if (!startStr || !endStr) continue;

          const dayStartMin = toMinutes(startStr);
          const dayEndMin = toMinutes(endStr);

          const dayLessons = lessons
            .filter((l) => l.instructor_id === instId && l.lesson_date === dateStr)
            .map((l) => {
              const s = toMinutes(l.start_time);
              return { start: s, end: s + (l.duration_minutes || 60) };
            });

          const dayBlocks = blocks
            .filter((b) => b.instructor_id === instId)
            .map((b) => {
              const s = new Date(b.start_datetime);
              const e = new Date(b.end_datetime);
              return { s, e };
            })
            .filter((b) => format(b.s, "yyyy-MM-dd") === dateStr || format(b.e, "yyyy-MM-dd") === dateStr)
            .map((b) => ({
              start: format(b.s, "yyyy-MM-dd") === dateStr ? b.s.getHours() * 60 + b.s.getMinutes() : 0,
              end: format(b.e, "yyyy-MM-dd") === dateStr ? b.e.getHours() * 60 + b.e.getMinutes() : 24 * 60,
            }));

          const dayEvents = events
            .filter((ev) => ev.instructor_id === instId)
            .map((ev) => {
              const s = new Date(ev.start_time);
              const e = new Date(ev.end_time);
              return { s, e };
            })
            .filter((ev) => format(ev.s, "yyyy-MM-dd") === dateStr || format(ev.e, "yyyy-MM-dd") === dateStr)
            .map((ev) => ({
              start: format(ev.s, "yyyy-MM-dd") === dateStr ? ev.s.getHours() * 60 + ev.s.getMinutes() : 0,
              end: format(ev.e, "yyyy-MM-dd") === dateStr ? ev.e.getHours() * 60 + ev.e.getMinutes() : 24 * 60,
            }));

          const conflicts = [...dayLessons, ...dayBlocks, ...dayEvents];

          // For "today" skip past slots
          const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;
          const nowMin = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : 0;

          for (let s = dayStartMin; s + durationMinutes <= dayEndMin; s += STEP_MINUTES) {
            const e = s + durationMinutes;
            if (isToday && s < nowMin) continue;
            if (!inTimeOfDay(s, timeOfDay)) continue;

            const collides = conflicts.some((c) => s < c.end + padMin && e > c.start - padMin);
            if (collides) continue;

            results.push({
              id: `${instId}-${dateStr}-${fromMinutes(s)}`,
              instructorId: instId,
              instructorName: instName,
              carType,
              postcodeArea: area,
              date: dateStr,
              startTime: fromMinutes(s),
              endTime: fromMinutes(e),
              durationMinutes,
              sortKey: new Date(`${dateStr}T${fromMinutes(s)}:00`).getTime(),
            });

            // Only emit one slot per "anchor" hour to keep list tight (skip ahead 60 min on success)
            s += 60 - STEP_MINUTES;
          }
        }
      }

      results.sort((a, b) => a.sortKey - b.sortKey);
      return results.slice(0, 200);
    },
  });
}
