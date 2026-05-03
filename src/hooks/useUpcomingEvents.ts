import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";

export type UpcomingEventType =
  | "drivingTest"
  | "theoryTest"
  | "mot"
  | "insuranceRenewal"
  | "task"
  | "training";

export interface UpcomingEvent {
  id: string;
  type: UpcomingEventType;
  date: Date;
  daysUntil: number;
  title: string;
  dateLabel: string;
  timeLabel: string;
  locationLabel: string;
  destinationPath: string;
}

const fmtDate = (d: Date) => `${format(d, "EEE")} ${format(d, "d MMM")}`;
const fmtTime = (t: string | null | undefined) => {
  if (!t) return "—";
  // accept "HH:mm:ss" or "HH:mm"
  return t.length >= 5 ? t.slice(0, 5) : t;
};

export function useUpcomingEvents(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["upcoming-events-home", instructorId],
    enabled: !!instructorId,
    queryFn: async (): Promise<UpcomingEvent[]> => {
      if (!instructorId) return [];
      const today = startOfDay(new Date());
      const todayStr = format(today, "yyyy-MM-dd");
      const horizonStr = format(addDays(today, 30), "yyyy-MM-dd");
      const events: UpcomingEvent[] = [];

      // Driving + Theory tests (from pupils)
      try {
        const { data: pupils } = await supabase
          .from("pupils")
          .select("id, name, test_date, test_time, test_centre_id, theory_test_date")
          .eq("instructor_id", instructorId);
        const centreIds = Array.from(
          new Set((pupils || []).map((p: any) => p.test_centre_id).filter(Boolean))
        );
        let centresById: Record<string, string> = {};
        if (centreIds.length) {
          const { data: centres } = await supabase
            .from("test_centres")
            .select("id, name")
            .in("id", centreIds as string[]);
          (centres || []).forEach((c: any) => (centresById[c.id] = c.name));
        }
        for (const p of pupils || []) {
          if (p.test_date && p.test_date >= todayStr && p.test_date <= horizonStr) {
            const d = parseISO(p.test_date);
            events.push({
              id: `dt-${p.id}`,
              type: "drivingTest",
              date: d,
              daysUntil: differenceInCalendarDays(d, today),
              title: `Driving test · ${p.name}`,
              dateLabel: fmtDate(d),
              timeLabel: fmtTime(p.test_time),
              locationLabel: centresById[p.test_centre_id] || "Test centre",
              destinationPath: `/instructor/pupils/${p.id}`,
            });
          }
          if (p.theory_test_date && p.theory_test_date >= todayStr && p.theory_test_date <= horizonStr) {
            const d = parseISO(p.theory_test_date);
            events.push({
              id: `tt-${p.id}`,
              type: "theoryTest",
              date: d,
              daysUntil: differenceInCalendarDays(d, today),
              title: `Theory test · ${p.name}`,
              dateLabel: fmtDate(d),
              timeLabel: "—",
              locationLabel: "Theory test centre",
              destinationPath: `/instructor/pupils/${p.id}`,
            });
          }
        }
      } catch (e) {
        console.error("[useUpcomingEvents] tests", e);
      }

      // Vehicles: MOT + Insurance
      try {
        const { data: vehicles } = await supabase
          .from("instructor_vehicles")
          .select("id, registration, make, model, mot_expiry, insurance_expiry")
          .eq("instructor_id", instructorId);
        for (const v of vehicles || []) {
          if (v.mot_expiry && v.mot_expiry >= todayStr && v.mot_expiry <= horizonStr) {
            const d = parseISO(v.mot_expiry);
            events.push({
              id: `mot-${v.id}`,
              type: "mot",
              date: d,
              daysUntil: differenceInCalendarDays(d, today),
              title: `Vehicle MOT · ${v.registration}`,
              dateLabel: fmtDate(d),
              timeLabel: "—",
              locationLabel: [v.make, v.model].filter(Boolean).join(" ") || "Vehicle",
              destinationPath: `/instructor/vehicle-health`,
            });
          }
          if (v.insurance_expiry && v.insurance_expiry >= todayStr && v.insurance_expiry <= horizonStr) {
            const d = parseISO(v.insurance_expiry);
            events.push({
              id: `ins-${v.id}`,
              type: "insuranceRenewal",
              date: d,
              daysUntil: differenceInCalendarDays(d, today),
              title: `Insurance renewal · ${v.registration}`,
              dateLabel: fmtDate(d),
              timeLabel: "—",
              locationLabel: [v.make, v.model].filter(Boolean).join(" ") || "Vehicle",
              destinationPath: `/instructor/vehicle-health`,
            });
          }
        }
      } catch (e) {
        console.error("[useUpcomingEvents] vehicles", e);
      }

      // Tasks / to-dos
      try {
        const { data: todos } = await supabase
          .from("instructor_todos")
          .select("id, title, description, due_date, is_completed")
          .eq("instructor_id", instructorId)
          .eq("is_completed", false)
          .not("due_date", "is", null)
          .gte("due_date", todayStr)
          .lte("due_date", horizonStr);
        for (const t of todos || []) {
          const d = parseISO(t.due_date as string);
          events.push({
            id: `todo-${t.id}`,
            type: "task",
            date: d,
            daysUntil: differenceInCalendarDays(d, today),
            title: t.title,
            dateLabel: fmtDate(d),
            timeLabel: "—",
            locationLabel: t.description || "—",
            destinationPath: `/instructor/todos`,
          });
        }
      } catch (e) {
        console.error("[useUpcomingEvents] todos", e);
      }

      // CPD / training
      try {
        const { data: cpd } = await supabase
          .from("cpd_log_entries")
          .select("id, title, date, provider")
          .eq("instructor_id", instructorId)
          .gte("date", todayStr)
          .lte("date", horizonStr);
        for (const c of cpd || []) {
          const d = parseISO(c.date as string);
          events.push({
            id: `cpd-${c.id}`,
            type: "training",
            date: d,
            daysUntil: differenceInCalendarDays(d, today),
            title: c.title,
            dateLabel: fmtDate(d),
            timeLabel: "—",
            locationLabel: c.provider || "Training",
            destinationPath: `/instructor/cpd`,
          });
        }
      } catch (e) {
        console.error("[useUpcomingEvents] cpd", e);
      }

      // Manual time blocks added via Add event dialog
      try {
        const horizonIso = addDays(today, 30).toISOString();
        const { data: blocks } = await supabase
          .from("instructor_manual_blocks")
          .select("id, title, start_datetime, block_type")
          .eq("instructor_id", instructorId)
          .gte("start_datetime", today.toISOString())
          .lte("start_datetime", horizonIso);
        for (const b of blocks || []) {
          const d = new Date(b.start_datetime as string);
          events.push({
            id: `block-${b.id}`,
            type: "task",
            date: d,
            daysUntil: differenceInCalendarDays(d, today),
            title: b.title || "Time block",
            dateLabel: fmtDate(d),
            timeLabel: format(d, "HH:mm"),
            locationLabel: (b.block_type as string) || "Block",
            destinationPath: `/instructor/schedule`,
          });
        }
      } catch (e) {
        console.error("[useUpcomingEvents] blocks", e);
      }

      events.sort((a, b) => a.date.getTime() - b.date.getTime());
      return events;
    },
    staleTime: 60_000,
  });
}
