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
        rejection: { total: 0, byReason: {}, padMin: 0, describe: (r) => describeReason(r) },
      };

      const targetIds =
        selectedInstructorId && selectedInstructorId !== "all"
          ? [selectedInstructorId]
          : instructorIds;

      if (targetIds.length === 0) return empty;

      const fromDateObj = startOfDay(new Date(fromDate));
      const toDateObj = addDays(fromDateObj, days - 1);

      const [instructorsRes, sources] = await Promise.all([
        supabase
          .from("public_instructors")
          .select("id, name, car_type, home_postcode, available_from, buffer_minutes, slot_increment_minutes, is_network_placeholder")
          .in("id", targetIds),
        loadCourseAvailabilitySources(supabase, targetIds, fromDateObj, toDateObj),
      ]);

      const instructors = (instructorsRes.data || []).filter((inst) => {
        if (!postcodePrefix) return true;
        const area = postcodeArea((inst as any).home_postcode);
        return !!area && area.startsWith(postcodePrefix.toUpperCase());
      });

      const results: AvailableSlot[] = [];
      const byReason: Partial<Record<RejectReason, number>> = {};
      let totalRejected = 0;

      for (const inst of instructors) {
        const instId = inst.id;
        const instName = (inst as any).name;
        const carType = (inst as any).car_type || null;
        const area = postcodeArea((inst as any).home_postcode);
        const instructor: InstructorLite = {
          id: instId,
          available_from: (inst as any).available_from ?? null,
          buffer_minutes: (inst as any).buffer_minutes ?? 0,
          is_network_placeholder: (inst as any).is_network_placeholder ?? false,
        };
        const slotIncrement = (inst as any).slot_increment_minutes ?? 60;
        const buffer = (inst as any).buffer_minutes ?? 0;

        for (let d = 0; d < days; d++) {
          const day = addDays(fromDateObj, d);
          const dateStr = format(day, "yyyy-MM-dd");

          const { slots: free, rejected } = computeDaySlots(instructor, day, sources, {
            durationMinutes,
            bufferMinutes: buffer,
            slotIncrementMinutes: slotIncrement,
            timeOfDay,
          });

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
          padMin: 0,
          describe: (r) => describeReason(r),
        },
      };
    },
  });
}
