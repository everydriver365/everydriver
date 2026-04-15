import { useState, useEffect, useMemo, useCallback } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameDay, isSameMonth, isToday, parseISO, isSunday } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, Loader2, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface MobileMonthCalendarViewProps {
  instructorId: string;
}

interface DayEvents {
  lessons: Array<{
    id: string;
    lesson_date: string;
    start_time: string;
    duration_minutes: number;
    lesson_type: string;
    status: string;
    payment_status: string | null;
    pickup_location: string | null;
    pupil: { name: string; address: string | null } | null;
  }>;
  external: Array<{
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    color: string | null;
    is_all_day: boolean;
  }>;
}

const lessonTypeBarColors: Record<string, string> = {
  standard: "#3b82f6",
  test_prep: "#f59e0b",
  mock_test: "#f43f5e",
  motorway: "#10b981",
  refresher: "#06b6d4",
  intensive: "#8b5cf6",
  first_lesson: "#22c55e",
  pass_plus: "#6366f1",
  driving_test: "#f97316",
};

const courseTypeLabels: Record<string, string> = {
  standard: "Standard",
  test_prep: "Test Prep",
  mock_test: "Mock Test",
  motorway: "Motorway",
  refresher: "Refresher",
  intensive: "Intensive",
  first_lesson: "First Lesson",
  pass_plus: "Pass Plus",
  driving_test: "Driving Test",
};

function contrastText(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "text-gray-900" : "text-white";
}

export function MobileMonthCalendarView({ instructorId }: MobileMonthCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [lessonDots, setLessonDots] = useState<Record<string, number>>({});
  const [externalDots, setExternalDots] = useState<Record<string, boolean>>({});
  const [dayEvents, setDayEvents] = useState<DayEvents>({ lessons: [], external: [] });
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [calendarStart.getTime(), calendarEnd.getTime()]);

  const fetchDots = useCallback(async () => {
    setLoading(true);
    const from = format(calendarStart, "yyyy-MM-dd");
    const to = format(calendarEnd, "yyyy-MM-dd");

    try {
      const [lessonsRes, externalRes] = await Promise.all([
        supabase
          .from("scheduled_lessons")
          .select("lesson_date")
          .eq("instructor_id", instructorId)
          .neq("status", "cancelled")
          .gte("lesson_date", from)
          .lte("lesson_date", to),
        supabase
          .from("instructor_calendar_events")
          .select("start_time")
          .eq("instructor_id", instructorId)
          .gte("start_time", `${from}T00:00:00`)
          .lte("start_time", `${to}T23:59:59`),
      ]);

      if (lessonsRes.data) {
        const counts: Record<string, number> = {};
        lessonsRes.data.forEach((r) => {
          counts[r.lesson_date] = (counts[r.lesson_date] || 0) + 1;
        });
        setLessonDots(counts);
      }

      if (externalRes.data) {
        const ext: Record<string, boolean> = {};
        externalRes.data.forEach((r) => {
          const dateKey = format(parseISO(r.start_time), "yyyy-MM-dd");
          ext[dateKey] = true;
        });
        setExternalDots(ext);
      }
    } catch (e) {
      console.error("Failed to fetch calendar dots:", e);
    } finally {
      setLoading(false);
    }
  }, [instructorId, calendarStart.getTime(), calendarEnd.getTime()]);

  useEffect(() => { fetchDots(); }, [fetchDots]);

  const fetchDayEvents = useCallback(async () => {
    setEventsLoading(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const dayStart = `${dateStr}T00:00:00`;
    const dayEnd = `${dateStr}T23:59:59`;

    try {
      const [lessonsRes, externalRes] = await Promise.all([
        supabase
          .from("scheduled_lessons")
          .select("id, lesson_date, start_time, duration_minutes, lesson_type, status, payment_status, pickup_location, pupil:pupils(name, address)")
          .eq("instructor_id", instructorId)
          .eq("lesson_date", dateStr)
          .neq("status", "cancelled")
          .order("start_time", { ascending: true }),
        supabase
          .from("instructor_calendar_events")
          .select("id, title, start_time, end_time, color")
          .eq("instructor_id", instructorId)
          .lte("start_time", dayEnd)
          .gte("end_time", dayStart),
      ]);

      const lessons = (lessonsRes.data || []).map((l: any) => ({
        ...l,
        pupil: l.pupil || null,
      }));

      const external = (externalRes.data || []).map((evt: any) => {
        const start = parseISO(evt.start_time);
        const end = parseISO(evt.end_time);
        const startMin = start.getHours() + start.getMinutes();
        const endHour = end.getHours();
        const isAllDay = startMin === 0 && (endHour === 23 || endHour === 0);
        return { ...evt, is_all_day: isAllDay };
      });

      setDayEvents({ lessons, external });
    } catch (e) {
      console.error("Failed to fetch day events:", e);
    } finally {
      setEventsLoading(false);
    }
  }, [instructorId, selectedDate]);

  useEffect(() => { fetchDayEvents(); }, [fetchDayEvents]);

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(":");
    return `${h}:${m}`;
  };

  const getEndTime = (startTime: string, dur: number) => {
    const [h, m] = startTime.split(":").map(Number);
    const end = h * 60 + m + dur;
    return `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
  };

  const allDayEvents = dayEvents.external.filter(e => e.is_all_day);
  const timedLessons = dayEvents.lessons.sort((a, b) => a.start_time.localeCompare(b.start_time));
  const timedExternal = dayEvents.external.filter(e => !e.is_all_day).sort((a, b) => a.start_time.localeCompare(b.start_time));

  const weekDayHeaders = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="flex flex-col h-full">
      {/* Month Header */}
      <div className="flex items-center justify-between px-2 py-3">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-base font-bold text-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 px-2">
        {weekDayHeaders.map((d, i) => (
          <div key={i} className={cn(
            "text-center text-xs font-medium py-1",
            i === 6 ? "text-destructive" : "text-muted-foreground"
          )}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 px-2 gap-y-0.5">
        {calendarDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, currentMonth);
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const hasLessons = lessonDots[dateKey] > 0;
          const hasExternal = externalDots[dateKey];
          const sunday = isSunday(day);

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 rounded-full transition-colors relative",
                "min-h-[44px]",
                !inMonth && "opacity-30",
                selected && "bg-[#1a3a4a] text-white",
                !selected && today && "ring-2 ring-[#1a3a4a]/40",
                !selected && sunday && "text-destructive",
                !selected && !sunday && "text-foreground",
              )}
            >
              <span className="text-sm font-medium leading-none">{format(day, "d")}</span>
              <div className="flex gap-0.5 mt-1 h-1.5">
                {hasLessons && (
                  <span className={cn("w-1.5 h-1.5 rounded-full", selected ? "bg-white/70" : "bg-amber-500")} />
                )}
                {hasExternal && (
                  <span className={cn("w-1.5 h-1.5 rounded-full", selected ? "bg-white/50" : "bg-teal-500")} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-border mt-2" />

      {/* Selected Day Events */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
          {format(selectedDate, "EEEE, d MMMM")}
        </p>

        {eventsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : allDayEvents.length === 0 && timedLessons.length === 0 && timedExternal.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No events</p>
          </div>
        ) : (
          <>
            {/* All-day events */}
            {allDayEvents.map((evt) => {
              const bgColor = evt.color || "#039be5";
              return (
                <div
                  key={evt.id}
                  className="rounded-lg px-3 py-2"
                  style={{ backgroundColor: bgColor }}
                >
                  <span className={`text-[13px] font-semibold ${contrastText(bgColor)}`}>{evt.title}</span>
                </div>
              );
            })}

            {/* Lessons - matching schedule view design */}
            {timedLessons.map((lesson) => {
              const barColor = lessonTypeBarColors[lesson.lesson_type] || "#3b82f6";
              const paid = lesson.payment_status === "paid";
              return (
                <div
                  key={lesson.id}
                  className="rounded-lg px-3 py-2.5 space-y-0.5"
                  style={{ backgroundColor: barColor }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-white truncate">
                      {lesson.pupil?.name || "Unknown"}
                    </span>
                    {!paid && (
                      <span className="text-[10px] font-semibold bg-white/25 text-white rounded px-1.5 py-0.5">
                        Unpaid
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-white/90 text-[12px]">
                    <span>{formatTime(lesson.start_time)} – {getEndTime(lesson.start_time, lesson.duration_minutes)}</span>
                    <span className="text-white/60">·</span>
                    <span>{courseTypeLabels[lesson.lesson_type] || lesson.lesson_type}</span>
                  </div>
                  {(lesson.pickup_location || lesson.pupil?.address) && (
                    <div className="flex items-center gap-1 text-white/75 text-[11px]">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{lesson.pickup_location || lesson.pupil?.address}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* External events - matching schedule view design */}
            {timedExternal.map((evt) => {
              const bgColor = evt.color || "#039be5";
              const startDt = parseISO(evt.start_time);
              const endDt = parseISO(evt.end_time);
              return (
                <div
                  key={evt.id}
                  className="rounded-lg px-3 py-2.5 space-y-0.5"
                  style={{ backgroundColor: bgColor }}
                >
                  <span className={`text-[13px] font-bold ${contrastText(bgColor)}`}>
                    {evt.title}
                  </span>
                  <div className={`text-[12px] ${contrastText(bgColor)} opacity-80`}>
                    {format(startDt, "HH:mm")} – {format(endDt, "HH:mm")}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Today Button */}
      <div className="px-4 py-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-2xl"
          onClick={goToToday}
        >
          Today
        </Button>
      </div>
    </div>
  );
}
