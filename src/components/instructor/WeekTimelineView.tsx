import { useMemo, useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, startOfWeek, isSameDay, format } from "date-fns";
import type { CalendarEvent } from "@/hooks/useInstructorCalendar";

interface Props {
  events: CalendarEvent[];
  currentDate: Date;
  onGoToDate: (d: Date) => void;
  onEventClick: (e: CalendarEvent) => void;
  onAddEvent: (d?: Date) => void;
  loading?: boolean;
}

const HOUR_HEIGHT = 56; // px per hour
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function eventColor(e: CalendarEvent): { bg: string; text: string } {
  if (e.type === "block") return { bg: "#B23A3F", text: "#FFFFFF" };
  if (e.type === "external") return { bg: "#6E7C99", text: "#FFFFFF" };
  // lesson
  const status = e.data?.status as string | undefined;
  if (status === "cancelled") return { bg: "#9CA3AF", text: "#FFFFFF" };
  return { bg: "#F08A2E", text: "#FFFFFF" };
}

function isPaid(e: CalendarEvent): boolean | null {
  if (e.type !== "lesson") return null;
  const ps = (e.data?.payment_status || "").toLowerCase();
  if (ps === "paid") return true;
  if (ps === "unpaid" || ps === "pending") return false;
  // fallback: balance heuristic
  const bal = e.data?.pupil_account_balance ?? 0;
  return bal >= 0;
}

export function WeekTimelineView({
  events,
  currentDate,
  onGoToDate,
  onEventClick,
  onAddEvent,
}: Props) {
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate]
  );
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Hours range: extend to fit events but clamp 6..22
  const { startHour, endHour } = useMemo(() => {
    let min = 8;
    let max = 19;
    events.forEach((ev) => {
      if (days.some((d) => isSameDay(d, ev.start))) {
        min = Math.min(min, ev.start.getHours());
        max = Math.max(max, ev.end.getHours() + (ev.end.getMinutes() > 0 ? 1 : 0));
      }
    });
    return { startHour: Math.max(0, min), endHour: Math.min(24, Math.max(max, min + 1)) };
  }, [events, days]);

  const hours = useMemo(
    () => Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i),
    [startHour, endHour]
  );

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll to 08:00 or now
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!scrollRef.current) return;
    const target = (Math.max(startHour, 8) - startHour) * HOUR_HEIGHT - 8;
    scrollRef.current.scrollTop = Math.max(0, target);
  }, [startHour]);

  const goPrev = () => onGoToDate(addDays(weekStart, -7));
  const goNext = () => onGoToDate(addDays(weekStart, 7));
  const goToday = () => onGoToDate(new Date());

  const totalHeight = (endHour - startHour) * HOUR_HEIGHT;
  const GUTTER = 44;

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    days.forEach((d) => (map[format(d, "yyyy-MM-dd")] = []));
    events.forEach((ev) => {
      const k = format(ev.start, "yyyy-MM-dd");
      if (map[k]) map[k].push(ev);
    });
    return map;
  }, [events, days]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#FFFFFF" }}>
      {/* Week nav header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: "0.5px solid #F0F3F8" }}>
        <button onClick={goPrev} aria-label="Previous week" style={{ width: 32, height: 32, borderRadius: 16, border: "none", background: "#F2F4F8", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft style={{ width: 16, height: 16, color: "#3D55A1" }} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>
            {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d")}
          </span>
          <button onClick={goToday} style={{ fontSize: 11, fontWeight: 600, color: "#3D55A1", background: "#EDF2FE", border: "none", padding: "4px 8px", borderRadius: 999 }}>
            Today
          </button>
        </div>
        <button onClick={goNext} aria-label="Next week" style={{ width: 32, height: 32, borderRadius: 16, border: "none", background: "#F2F4F8", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChevronRight style={{ width: 16, height: 16, color: "#3D55A1" }} />
        </button>
      </div>

      {/* Day header row */}
      <div style={{ display: "grid", gridTemplateColumns: `${GUTTER}px repeat(7, 1fr)`, borderBottom: "0.5px solid #F0F3F8", background: "#FFFFFF" }}>
        <div />
        {days.map((d, i) => {
          const today = isSameDay(d, now);
          return (
            <button
              key={i}
              onClick={() => onGoToDate(d)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                padding: "8px 0", border: "none", background: "transparent", cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 10, color: "#8E8E93", fontWeight: 500 }}>{DAY_LABELS[i]}</span>
              <span
                style={{
                  width: 26, height: 26, borderRadius: 13,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                  background: today ? "#3D55A1" : "transparent",
                  color: today ? "#FFFFFF" : "#1A1A1A",
                }}
              >
                {format(d, "d")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scrollable timetable */}
      <div ref={scrollRef} style={{ flex: 1, overflow: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: `${GUTTER}px repeat(7, 1fr)`, position: "relative", height: totalHeight }}>
          {/* Hour gutter */}
          <div style={{ position: "relative" }}>
            {hours.map((h, i) => (
              <div
                key={h}
                style={{
                  position: "absolute", top: i * HOUR_HEIGHT - 6, right: 4,
                  fontSize: 10, color: "#8E8E93", fontWeight: 500,
                }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d, di) => {
            const key = format(d, "yyyy-MM-dd");
            const dayEvents = eventsByDay[key] || [];
            const today = isSameDay(d, now);
            const nowMins = today ? now.getHours() * 60 + now.getMinutes() - startHour * 60 : null;

            return (
              <div
                key={key}
                onClick={(e) => {
                  if (e.target === e.currentTarget) onAddEvent(d);
                }}
                style={{
                  position: "relative",
                  borderLeft: "0.5px solid #F0F3F8",
                  background: di >= 5 ? "#FAFBFC" : "#FFFFFF",
                }}
              >
                {/* Hour gridlines */}
                {hours.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute", left: 0, right: 0, top: i * HOUR_HEIGHT,
                      height: 1, background: "#F0F3F8",
                    }}
                  />
                ))}

                {/* Now line */}
                {nowMins !== null && nowMins >= 0 && nowMins <= (endHour - startHour) * 60 && (
                  <div
                    style={{
                      position: "absolute", left: 0, right: 0,
                      top: (nowMins / 60) * HOUR_HEIGHT,
                      height: 2, background: "#3D55A1", zIndex: 5,
                    }}
                  >
                    <div style={{ position: "absolute", left: -3, top: -3, width: 8, height: 8, borderRadius: 4, background: "#3D55A1" }} />
                  </div>
                )}

                {/* Events */}
                {dayEvents.map((ev) => {
                  const startMins = ev.start.getHours() * 60 + ev.start.getMinutes() - startHour * 60;
                  const durMins = Math.max(30, (ev.end.getTime() - ev.start.getTime()) / 60000);
                  const top = (startMins / 60) * HOUR_HEIGHT;
                  const height = (durMins / 60) * HOUR_HEIGHT - 2;
                  const colors = eventColor(ev);
                  const paid = isPaid(ev);

                  return (
                    <button
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(ev);
                      }}
                      style={{
                        position: "absolute",
                        top, left: 1, right: 1, height,
                        background: colors.bg,
                        color: colors.text,
                        border: "none",
                        borderRadius: 4,
                        padding: "3px 4px 0",
                        textAlign: "left",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        cursor: "pointer",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9, fontWeight: 600, lineHeight: "11px",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          wordBreak: "break-word",
                        }}
                      >
                        {ev.title}
                      </div>
                      {height >= 38 && (
                        <div style={{ fontSize: 9, fontWeight: 700, marginTop: 2, lineHeight: "11px" }}>
                          {format(ev.start, "HH:mm")}
                        </div>
                      )}
                      {height >= 52 && (
                        <div style={{ fontSize: 9, fontWeight: 700, lineHeight: "11px" }}>
                          {format(ev.end, "HH:mm")}
                        </div>
                      )}
                      {paid !== null && height >= 30 && (
                        <div style={{ marginTop: "auto", marginLeft: -4, marginRight: -4, marginBottom: 0 }}>
                          <div
                            style={{
                              background: paid ? "#2BB673" : "#E94B7B",
                              color: "#FFFFFF",
                              fontSize: 9,
                              fontWeight: 700,
                              textAlign: "center",
                              padding: "2px 0",
                            }}
                          >
                            {paid ? "Paid" : "Unpaid"}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
