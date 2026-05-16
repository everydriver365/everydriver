import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay } from "date-fns";
import {
  describeReason,
  fromMinutes,
  type RejectReason,
  type TimeOfDay,
} from "@/lib/availabilityEngine";
import {
  loadCourseAvailabilitySources,
  computeDaySlots,
  type InstructorLite,
} from "@/lib/courseAvailability";

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

export interface RejectionSummary {
  total: number;
  byReason: Partial<Record<RejectReason, number>>;
  padMin: number;
  describe: (reason: RejectReason) => string;
}

export interface AvailabilitySearchResult {
  slots: AvailableSlot[];
  rejection: RejectionSummary;
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
    queryFn: async (): Promise<AvailabilitySearchResult> => {
      const empty: AvailabilitySearchResult = {
        slots: [],
        rejection: { total: 0, byReason: {}, padMin: 0, describe: (r) => describeReason(r, 0) },
      };

      const targetIds =
        selectedInstructorId && selectedInstructorId !== "all"
          ? [selectedInstructorId]
          : instructorIds;

      if (targetIds.length === 0) return empty;

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
          .from("public_instructors")
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

      // No hard-coded fallback working window: instructors who have not
      // configured working hours simply have no availability and will not
      // appear in results until they set them up in their portal.
      const workingHours = workingHoursRes.data || [];
      const overrides = overridesRes.data || [];
      const lessons = lessonsRes.data || [];
      const blocks = blocksRes.data || [];
      // Filter out all-day / multi-day calendar events. These are typically
      // synced informational items (e.g. "Summer term", "College AM") that
      // span entire days and would otherwise wipe out every working slot.
      // We only treat timed events (< 24h, not aligned to midnight) as conflicts.
      const events = (eventsRes.data || []).filter((ev) => {
        try {
          const s = new Date(ev.start_time);
          const e = new Date(ev.end_time);
          const durMs = e.getTime() - s.getTime();
          const startsAtMidnight = s.getUTCHours() === 0 && s.getUTCMinutes() === 0;
          const isAllDayLike = durMs >= 23 * 60 * 60 * 1000;
          if (isAllDayLike) return false;
          if (startsAtMidnight && durMs >= 12 * 60 * 60 * 1000) return false;
          return true;
        } catch {
          return true;
        }
      });

      const results: AvailableSlot[] = [];
      const byReason: Partial<Record<RejectReason, number>> = {};
      let totalRejected = 0;
      let lastPad = 0;

      for (const inst of instructors) {
        const instId = inst.id;
        const instName = inst.name;
        const carType = inst.car_type || null;
        const area = postcodeArea(inst.home_postcode);
        const bufferMin =
          (inst as { buffer_minutes?: number | null }).buffer_minutes ?? 0;

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

          const dayLessons = lessons.filter(
            (l) => l.instructor_id === instId && l.lesson_date === dateStr,
          );
          const dayBlocks = blocks.filter((b) => b.instructor_id === instId);
          const dayEvents = events.filter((ev) => ev.instructor_id === instId);

          const conflicts = buildDayConflicts(
            dateStr,
            dayLessons,
            dayBlocks,
            dayEvents,
          );
          const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;

          const { slots: free, rejected, padMin } = computeSlotResult({
            dateStr,
            dayStartMin: toMinutes(startStr),
            dayEndMin: toMinutes(endStr),
            bufferMinutes: bufferMin,
            durationMinutes,
            timeOfDay,
            conflicts,
            isToday,
            anchorSkipMinutes: 60,
          });
          lastPad = padMin;

          for (const r of rejected) {
            byReason[r.reason] = (byReason[r.reason] || 0) + 1;
            totalRejected += 1;
          }

          for (const slot of free) {
            results.push({
              id: `${instId}-${dateStr}-${fromMinutes(slot.start)}`,
              instructorId: instId,
              instructorName: instName,
              carType,
              postcodeArea: area,
              date: dateStr,
              startTime: fromMinutes(slot.start),
              endTime: fromMinutes(slot.end),
              durationMinutes,
              sortKey: new Date(
                `${dateStr}T${fromMinutes(slot.start)}:00`,
              ).getTime(),
            });
          }
        }
      }

      results.sort((a, b) => a.sortKey - b.sortKey);
      return {
        slots: results.slice(0, 200),
        rejection: {
          total: totalRejected,
          byReason,
          padMin: lastPad,
          describe: (r) => describeReason(r, lastPad),
        },
      };
    },
  });
}
