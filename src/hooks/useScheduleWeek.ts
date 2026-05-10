import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeHub";
import { useQueryClient } from "@tanstack/react-query";
import { computeLessonAmount } from "@/lib/pricing/resolveHourlyRate";
import { fetchInstructorPostcodeRules } from "@/hooks/useInstructorPostcodeRules";


export interface ScheduleLesson {
  id: string;
  pupilId: string;
  pupilName: string;
  pupilFirstName: string;
  pupilLastInitial: string;
  startTime: string; // HH:MM
  startTimeFull: string; // HH:MM:SS
  endTime: string; // HH:MM
  startDate: Date;
  endDate: Date;
  durationMinutes: number;
  pickupPostcode: string | null;
  pickupLocation: string | null;
  lessonType: string;
  status: string;
  paymentStatus: string;
  amountDue: number;
  /** Resolved £ amount honoring postcode overrides + pupil custom rate. */
  effectiveAmount: number;
  isFirstLesson?: boolean;
  isLastLesson?: boolean;
}

export interface ScheduleDay {
  date: Date;
  dateStr: string;
  dayOfWeek: string; // MON
  dayOfMonth: number;
  monthShort: string;
  isToday: boolean;
  isWorkingDay: boolean;
  workingStart: string; // HH:MM
  workingEnd: string;
  hoursAvailable: number;
  hoursBooked: number;
  utilizationPercent: number;
  lessons: ScheduleLesson[];
}

export interface InstructorScheduleSettings {
  standardRate: number;
  workingHours: { start: string; end: string };
  workingDays: number[]; // 1=Mon..7=Sun
}

const DEFAULT_SETTINGS: InstructorScheduleSettings = {
  standardRate: 40,
  workingHours: { start: "09:00", end: "20:00" },
  workingDays: [1, 2, 3, 4, 5, 6],
};

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function isoDow(d: Date) {
  const js = d.getDay(); // 0=Sun..6=Sat
  return js === 0 ? 7 : js;
}

function fmtName(name: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  const first = parts[0] || "Pupil";
  const lastInitial = parts.length > 1 ? `${parts[parts.length - 1][0]}.` : "";
  return { first, lastInitial };
}

export function useInstructorScheduleSettings(instructorId: string | undefined) {
  return useQuery({
    queryKey: ["instructor-schedule-settings", instructorId],
    enabled: !!instructorId,
    queryFn: async (): Promise<InstructorScheduleSettings> => {
      const [instRes, winRes] = await Promise.all([
        supabase
          .from("instructors")
          .select("hourly_rate")
          .eq("id", instructorId!)
          .maybeSingle(),
        supabase
          .from("availability_windows")
          .select("day_of_week, start_time, end_time, is_active")
          .eq("instructor_id", instructorId!)
          .eq("is_active", true),
      ]);

      const rate = Number((instRes.data as any)?.hourly_rate ?? DEFAULT_SETTINGS.standardRate);

      const rows = winRes.data || [];
      if (rows.length === 0) {
        return { ...DEFAULT_SETTINGS, standardRate: rate };
      }

      // Aggregate per-day spans (use earliest start, latest end), and infer workingDays
      const byDay = new Map<number, { start: string; end: string }>();
      for (const r of rows as any[]) {
        const d = Number(r.day_of_week);
        const s = String(r.start_time).slice(0, 5);
        const e = String(r.end_time).slice(0, 5);
        const cur = byDay.get(d);
        if (!cur) byDay.set(d, { start: s, end: e });
        else byDay.set(d, {
          start: s < cur.start ? s : cur.start,
          end: e > cur.end ? e : cur.end,
        });
      }
      const workingDays = Array.from(byDay.keys()).sort();
      // overall envelope across days for default working hours
      let minStart = "23:59";
      let maxEnd = "00:00";
      byDay.forEach((v) => {
        if (v.start < minStart) minStart = v.start;
        if (v.end > maxEnd) maxEnd = v.end;
      });
      return {
        standardRate: rate,
        workingHours: { start: minStart, end: maxEnd },
        workingDays: workingDays.length ? workingDays : DEFAULT_SETTINGS.workingDays,
      };
    },
  });
}

export function useScheduleWeek(
  instructorId: string | undefined,
  startDate: Date,
  days: number = 7,
) {
  const queryClient = useQueryClient();
  const { data: settings } = useInstructorScheduleSettings(instructorId);

  const start = useMemo(() => startOfDay(startDate), [startDate]);
  const startStr = format(start, "yyyy-MM-dd");
  const endDate = addDays(start, days - 1);
  const endStr = format(endDate, "yyyy-MM-dd");

  const queryKey = ["schedule-week", instructorId, startStr, days];

  const query = useQuery({
    queryKey,
    enabled: !!instructorId,
    queryFn: async (): Promise<ScheduleDay[]> => {
      const { data, error } = await supabase
        .from("scheduled_lessons")
        .select(`
          id, pupil_id, lesson_date, start_time, duration_minutes,
          pickup_postcode, pickup_location, status, lesson_type,
          payment_status, amount_due,
          pupils!inner (id, name, postcode, address)
        `)
        .eq("instructor_id", instructorId!)
        .gte("lesson_date", startStr)
        .lte("lesson_date", endStr)
        .neq("status", "cancelled")
        .order("lesson_date")
        .order("start_time");

      if (error) throw error;

      const s = settings || DEFAULT_SETTINGS;
      const today = startOfDay(new Date()).getTime();

      const lessonsByDate = new Map<string, ScheduleLesson[]>();
      (data || []).forEach((l: any) => {
        const dateStr = l.lesson_date as string;
        const startTimeFull = String(l.start_time);
        const startTime = startTimeFull.slice(0, 5);
        const dur = Number(l.duration_minutes || 60);
        const startD = new Date(`${dateStr}T${startTime}:00`);
        const endD = new Date(startD.getTime() + dur * 60_000);
        const endTime = format(endD, "HH:mm");
        const pupil = l.pupils;
        const { first, lastInitial } = fmtName(pupil?.name || "Pupil");

        const ls: ScheduleLesson = {
          id: l.id,
          pupilId: l.pupil_id || pupil?.id || "",
          pupilName: pupil?.name || "Pupil",
          pupilFirstName: first,
          pupilLastInitial: lastInitial,
          startTime,
          startTimeFull: startTimeFull.length === 5 ? `${startTimeFull}:00` : startTimeFull,
          endTime,
          startDate: startD,
          endDate: endD,
          durationMinutes: dur,
          pickupPostcode: l.pickup_postcode || pupil?.postcode || null,
          pickupLocation: l.pickup_location || pupil?.address || null,
          lessonType: l.lesson_type || "Standard",
          status: l.status || "scheduled",
          paymentStatus: l.payment_status || "unpaid",
          amountDue: Number(l.amount_due ?? 0),
        };
        const arr = lessonsByDate.get(dateStr) || [];
        arr.push(ls);
        lessonsByDate.set(dateStr, arr);
      });

      const out: ScheduleDay[] = [];
      for (let i = 0; i < days; i++) {
        const d = addDays(start, i);
        const dateStr = format(d, "yyyy-MM-dd");
        const dow = isoDow(d);
        const isWorkingDay = s.workingDays.includes(dow);
        const workingStart = s.workingHours.start;
        const workingEnd = s.workingHours.end;
        const hoursAvailable = isWorkingDay
          ? (timeToMinutes(workingEnd) - timeToMinutes(workingStart)) / 60
          : 0;
        const lessons = (lessonsByDate.get(dateStr) || []).sort((a, b) =>
          a.startTime.localeCompare(b.startTime),
        );
        const minutesBooked = lessons.reduce((sum, l) => sum + l.durationMinutes, 0);
        const hoursBooked = minutesBooked / 60;
        const utilizationPercent = hoursAvailable > 0
          ? Math.min(100, Math.round((hoursBooked / hoursAvailable) * 100))
          : 0;

        out.push({
          date: d,
          dateStr,
          dayOfWeek: format(d, "EEE").toUpperCase(),
          dayOfMonth: d.getDate(),
          monthShort: format(d, "MMM"),
          isToday: d.getTime() === today,
          isWorkingDay,
          workingStart,
          workingEnd,
          hoursAvailable,
          hoursBooked,
          utilizationPercent,
          lessons,
        });
      }
      return out;
    },
    staleTime: 30_000,
  });

  // Realtime: refetch on lesson changes for this instructor.
  useRealtimeSubscription(
    "scheduled_lessons",
    "*",
    () => queryClient.invalidateQueries({ queryKey: ["schedule-week", instructorId] }),
    { filter: instructorId ? `instructor_id=eq.${instructorId}` : undefined, enabled: !!instructorId },
  );

  return { ...query, settings: settings || DEFAULT_SETTINGS };
}
