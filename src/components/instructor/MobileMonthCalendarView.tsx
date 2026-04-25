import { useState, useEffect, useMemo, useCallback } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameDay, isSameMonth, isToday, parseISO, isWeekend } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORY_STYLES,
  categoriseEvent,
  styleFromGoogleColor,
  type EventCategory,
} from "./scheduleGoogleStyle";

interface MobileMonthCalendarViewProps {
  instructorId: string;
}

interface DayDot {
  // The saturated source colour used for the status dot (chip border).
  dot: string;
  // The pale chip background colour used for legend swatches and lesson blocks.
  bg: string;
}

interface DayDots {
  // Deduped by `dot` colour so identical-coloured events collapse to one dot.
  entries: DayDot[];
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

// Resolve the same chip style the list view renders for an external event.
function externalStyle(title: string, color: string | null, isAllDay: boolean) {
  const category = categoriseEvent(title, "external", { isAllDay });
  return styleFromGoogleColor(color) ?? CATEGORY_STYLES[category];
}

// Friendly legend label for a chip background colour.
const CATEGORY_BY_BG: Record<string, { label: string; color: string }> = {
  [CATEGORY_STYLES.lesson.bg]: { label: "Lesson", color: CATEGORY_STYLES.lesson.bg },
  [CATEGORY_STYLES.blocked.bg]: { label: "Blocked", color: CATEGORY_STYLES.blocked.bg },
  [CATEGORY_STYLES.holiday.bg]: { label: "Holiday", color: CATEGORY_STYLES.holiday.bg },
  [CATEGORY_STYLES.course.bg]: { label: "Course", color: CATEGORY_STYLES.course.bg },
  [CATEGORY_STYLES.admin.bg]: { label: "Admin", color: CATEGORY_STYLES.admin.bg },
  [CATEGORY_STYLES.task.bg]: { label: "Task", color: CATEGORY_STYLES.task.bg },
};

export function MobileMonthCalendarView({ instructorId }: MobileMonthCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayDotMap, setDayDotMap] = useState<Record<string, DayDots>>({});
  const [presentEntries, setPresentEntries] = useState<DayDot[]>([]);
  const [dayEvents, setDayEvents] = useState<DayEvents>({ lessons: [], external: [] });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarStart.getTime(), calendarEnd.getTime()]);

  const fetchDots = useCallback(async () => {
    const from = format(calendarStart, "yyyy-MM-dd");
    const to = format(calendarEnd, "yyyy-MM-dd");

    try {
      const [lessonsRes, externalRes] = await Promise.all([
        supabase
          .from("scheduled_lessons")
          .select("lesson_date, lesson_type")
          .eq("instructor_id", instructorId)
          .neq("status", "cancelled")
          .gte("lesson_date", from)
          .lte("lesson_date", to),
        supabase
          .from("instructor_calendar_events")
          .select("start_time, end_time, title, color")
          .eq("instructor_id", instructorId)
          .gte("start_time", `${from}T00:00:00`)
          .lte("start_time", `${to}T23:59:59`),
      ]);

      // Track unique event styles per day (keyed by dot colour to dedupe),
      // mirroring the list view's resolved chip palette.
      const map: Record<string, Map<string, DayDot>> = {};
      const present = new Map<string, DayDot>();

      const recordEntry = (dateKey: string, entry: DayDot) => {
        if (!map[dateKey]) map[dateKey] = new Map();
        if (!map[dateKey].has(entry.dot)) map[dateKey].set(entry.dot, entry);
        if (!present.has(entry.dot)) present.set(entry.dot, entry);
      };

      // All lessons render with the lesson chip in the list view.
      const lessonEntry: DayDot = {
        dot: CATEGORY_STYLES.lesson.border,
        bg: CATEGORY_STYLES.lesson.bg,
      };
      (lessonsRes.data || []).forEach((r: any) => {
        recordEntry(r.lesson_date, lessonEntry);
      });

      (externalRes.data || []).forEach((r: any) => {
        const dateKey = format(parseISO(r.start_time), "yyyy-MM-dd");
        const start = parseISO(r.start_time);
        const end = r.end_time ? parseISO(r.end_time) : start;
        const startMin = start.getHours() + start.getMinutes();
        const endHour = end.getHours();
        const isAllDay = startMin === 0 && (endHour === 23 || endHour === 0);
        const style = externalStyle(r.title, r.color, isAllDay);
        recordEntry(dateKey, { dot: style.border, bg: style.bg });
      });

      const out: Record<string, DayDots> = {};
      Object.entries(map).forEach(([k, v]) => {
        out[k] = { entries: Array.from(v.values()) };
      });
      setDayDotMap(out);
      setPresentEntries(Array.from(present.values()));
    } catch (e) {
      console.error("Failed to fetch calendar dots:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

  const legendCategories: DotCategory[] = (["lesson", "course", "test", "personal"] as DotCategory[])
    .filter(c => presentCategories.has(c));

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "#FFFFFF", padding: 16, gap: 16, fontFamily }}
    >
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between" style={{ padding: "0 4px" }}>
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          aria-label="Previous month"
          style={{
            background: "transparent",
            border: "none",
            padding: 6,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={18} strokeWidth={1.8} color="#6E6E73" style={{ strokeLinecap: "round", strokeLinejoin: "round" }} />
        </button>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: "#000000",
            letterSpacing: "-0.2px",
            margin: 0,
          }}
        >
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          aria-label="Next month"
          style={{
            background: "transparent",
            border: "none",
            padding: 6,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ChevronRight size={18} strokeWidth={1.8} color="#6E6E73" style={{ strokeLinecap: "round", strokeLinejoin: "round" }} />
        </button>
      </div>

      {/* Weekday Headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {weekDayHeaders.map((d, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              padding: "4px 0",
              fontSize: 11,
              fontWeight: 500,
              color: "#6E6E73",
              letterSpacing: "0.2px",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {calendarDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, currentMonth);
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const weekend = isWeekend(day);
          const dots = dayDotMap[dateKey]?.categories || [];

          // Determine date number colour
          let dateColor: string;
          if (today || (selected && !today)) {
            dateColor = "#FFFFFF";
          } else if (!inMonth) {
            dateColor = "#C7C7CC";
          } else if (weekend) {
            dateColor = "#6E6E73";
          } else {
            dateColor = "#000000";
          }

          // Render up to 3 dots; >3 → first 2 + grey "more" dot
          const dotsToRender: string[] = [];
          if (dots.length <= 3) {
            dots.forEach(c => dotsToRender.push(DOT_COLORS[c]));
          } else {
            dotsToRender.push(DOT_COLORS[dots[0]]);
            dotsToRender.push(DOT_COLORS[dots[1]]);
            dotsToRender.push("#6E6E73");
          }

          const indicatorBg = today ? "#2B7BC8" : selected ? "#1F1F1F" : null;
          const dotInsideIndicator = today || selected;

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDate(day)}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "6px 0",
                gap: 4,
                cursor: "pointer",
                background: "transparent",
                border: "none",
                minHeight: 44,
              }}
            >
              {indicatorBg && (
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: indicatorBg,
                  }}
                />
              )}
              <span
                style={{
                  position: "relative",
                  fontSize: 14,
                  fontWeight: today || (selected && !today) ? 500 : 400,
                  color: dateColor,
                  lineHeight: "20px",
                  zIndex: 1,
                }}
              >
                {format(day, "d")}
              </span>
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  gap: 2,
                  height: 4,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {dotsToRender.length === 0 ? (
                  <div style={{ width: 4, height: 4 }} />
                ) : (
                  dotsToRender.map((color, idx) => (
                    <span
                      key={idx}
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: dotInsideIndicator ? "#FFFFFF" : color,
                      }}
                    />
                  ))
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Dot Legend */}
      {legendCategories.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            padding: "4px 0",
            flexWrap: "wrap",
          }}
        >
          {legendCategories.map((cat) => (
            <div key={cat} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: DOT_COLORS[cat],
                }}
              />
              <span style={{ fontSize: 11, color: "#6E6E73" }}>{DOT_LABELS[cat]}</span>
            </div>
          ))}
        </div>
      )}

      {/* Selected Day Detail Panel */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          borderTop: "0.5px solid #E5E5EA",
          paddingTop: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#6E6E73",
            letterSpacing: "0.3px",
            textTransform: "uppercase",
            margin: "0 0 12px",
          }}
        >
          {format(selectedDate, "EEEE, d MMMM")}
        </div>

        {eventsLoading ? (
          <div className="flex items-center justify-center" style={{ padding: "32px 0" }}>
            <Loader2 className="animate-spin" size={20} color="#6E6E73" />
          </div>
        ) : allDayEvents.length === 0 && timedLessons.length === 0 && timedExternal.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "32px 0",
              textAlign: "center",
            }}
          >
            <Calendar size={20} strokeWidth={1.8} color="#6E6E73" />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#000000" }}>No lessons</span>
            <span style={{ fontSize: 12, color: "#6E6E73" }}>Tap a different date or add a lesson</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* All-day external events */}
            {allDayEvents.map((evt) => {
              const cat = categoriseExternal(evt.title);
              return (
                <div
                  key={evt.id}
                  style={{
                    backgroundColor: LESSON_TINT[cat],
                    borderRadius: 10,
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#000000",
                      letterSpacing: "-0.1px",
                      marginBottom: 3,
                    }}
                  >
                    {evt.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#6E6E73" }}>All day</div>
                </div>
              );
            })}

            {/* Lessons */}
            {timedLessons.map((lesson) => {
              const cat = categoriseLessonType(lesson.lesson_type);
              const paid = lesson.payment_status === "paid";
              return (
                <div
                  key={lesson.id}
                  style={{
                    backgroundColor: LESSON_TINT[cat],
                    borderRadius: 10,
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 3,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#000000",
                        letterSpacing: "-0.1px",
                      }}
                    >
                      {lesson.pupil?.name || "Unknown"}
                    </span>
                    {!paid && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          color: "#6E6E73",
                          background: "rgba(0,0,0,0.06)",
                          borderRadius: 4,
                          padding: "1px 6px",
                        }}
                      >
                        Unpaid
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#6E6E73" }}>
                    {formatTime(lesson.start_time)} – {getEndTime(lesson.start_time, lesson.duration_minutes)}
                    {" · "}
                    {courseTypeLabels[lesson.lesson_type] || lesson.lesson_type}
                  </div>
                </div>
              );
            })}

            {/* Timed external events */}
            {timedExternal.map((evt) => {
              const cat = categoriseExternal(evt.title);
              const startDt = parseISO(evt.start_time);
              const endDt = parseISO(evt.end_time);
              return (
                <div
                  key={evt.id}
                  style={{
                    backgroundColor: LESSON_TINT[cat],
                    borderRadius: 10,
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#000000",
                      letterSpacing: "-0.1px",
                      marginBottom: 3,
                    }}
                  >
                    {evt.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#6E6E73" }}>
                    {format(startDt, "HH:mm")} – {format(endDt, "HH:mm")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
