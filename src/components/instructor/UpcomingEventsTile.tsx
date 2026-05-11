import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Car,
  BookOpen,
  Wrench,
  ShieldCheck,
  ListTodo,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  useUpcomingEvents,
  UpcomingEvent,
  UpcomingEventType,
} from "@/hooks/useUpcomingEvents";
import { AddCalendarEventDialog } from "@/components/instructor/AddCalendarEventDialog";
import { useQueryClient } from "@tanstack/react-query";

/* -------------------------------------------------------------------------- */
/* Tokens                                                                     */
/* -------------------------------------------------------------------------- */

const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

const BLUE = "#1A52A0";
const BLUE_TINT = "#EDF2FE";
const TEXT = "#1A1A1A";
const TEXT_MUTED = "#6E6E73";
const TEXT_SUBTLE = "#8E8E93";
const TEXT_DISABLED = "#C7C7CC";
const HAIRLINE = "#F0F3F8";
const CARD_BORDER = "rgba(26,82,160,0.08)";
const CHIP_BG = "#F2F4F8";

/* Per-type icon styling — accent + soft tint */
const typeStyle: Record<
  UpcomingEventType,
  { icon: LucideIcon; iconBg: string; iconColor: string }
> = {
  drivingTest:      { icon: Car,            iconBg: "#FFF0F0", iconColor: "#CC2229" },
  theoryTest:       { icon: BookOpen,       iconBg: "#EEF3FF", iconColor: "#1A52A0" },
  mot:              { icon: Wrench,         iconBg: "#E8F8ED", iconColor: "#1A7A3C" },
  insuranceRenewal: { icon: ShieldCheck,    iconBg: "#E8F8ED", iconColor: "#1A7A3C" },
  task:             { icon: ListTodo,       iconBg: "#EEF3FF", iconColor: "#1A52A0" },
  training:         { icon: GraduationCap,  iconBg: "#FFF6E6", iconColor: "#B45309" },
};

function countdownLabel(d: number): string {
  if (d === 0) return "Today";
  return `${d}d`;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

interface Props {
  instructorId: string;
}

export function UpcomingEventsTile({ instructorId }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: events = [], isLoading, isError, refetch } = useUpcomingEvents(instructorId);
  const [addOpen, setAddOpen] = useState(false);

  const today = startOfDay(new Date());
  const [viewMonth, setViewMonth] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  /* 9-day window centred on the selected date, anchored to the visible month */
  const visibleDays = useMemo(() => {
    // Anchor: week containing the selected date, but start 1 day earlier
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const start = addDays(weekStart, -1);
    return Array.from({ length: 9 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  const monthLabel = format(viewMonth, "MMMM yyyy");

  /* Map of dots per day for indicators */
  const dotsByDay = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const e of events) {
      const key = format(e.date, "yyyy-MM-dd");
      const arr = map.get(key) || [];
      const c = typeStyle[e.type].iconColor;
      if (!arr.includes(c)) arr.push(c);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  /* Filter events to selected date; if none, fall back to next upcoming */
  const eventsForSelected = useMemo(
    () => events.filter((e) => isSameDay(e.date, selectedDate)),
    [events, selectedDate],
  );
  const isToday = isSameDay(selectedDate, today);
  const showFallback = eventsForSelected.length === 0;
  const visibleEvents = showFallback ? events.slice(0, 4) : eventsForSelected.slice(0, 4);

  const goSeeAll = () => navigate("/instructor/schedule");

  const handlePrevMonth = () => {
    const next = subMonths(viewMonth, 1);
    setViewMonth(next);
    setSelectedDate(startOfDay(next));
  };
  const handleNextMonth = () => {
    const next = addMonths(viewMonth, 1);
    setViewMonth(next);
    setSelectedDate(startOfDay(next));
  };

  return (
    <div style={{ marginTop: 14, padding: "0 16px", fontFamily: FONT }}>
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
          padding: "0 4px",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: TEXT_SUBTLE,
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          Upcoming events
        </span>
        <button
          onClick={goSeeAll}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 11,
            fontWeight: 600,
            color: BLUE,
            cursor: "pointer",
          }}
        >
          View all ›
        </button>
      </div>

      {/* Card */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 18,
          overflow: "hidden",
          border: `0.5px solid ${CARD_BORDER}`,
          marginBottom: 24,
        }}
      >
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : events.length === 0 ? (
          <EmptyState onAdd={() => setAddOpen(true)} />
        ) : (
          <>
            {/* Calendar header */}
            <div style={{ padding: "12px 14px 10px" }}>
              {/* Month nav row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <button
                  onClick={handlePrevMonth}
                  style={navBtn}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={10} color="#5B6B8A" strokeWidth={2.2} />
                </button>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: TEXT,
                      letterSpacing: -0.2,
                    }}
                  >
                    {monthLabel}
                  </span>
                  <span style={{ fontSize: 9, color: TEXT_SUBTLE, marginTop: 1 }}>
                    {events.length} upcoming event{events.length === 1 ? "" : "s"}
                  </span>
                </div>
                <button
                  onClick={handleNextMonth}
                  style={navBtn}
                  aria-label="Next month"
                >
                  <ChevronRight size={10} color="#5B6B8A" strokeWidth={2.2} />
                </button>
              </div>

              {/* Day label row */}
              <div style={{ display: "flex", marginBottom: 3 }}>
                {visibleDays.map((day) => {
                  const dToday = isSameDay(day, today);
                  const isPast = day < today && !dToday;
                  return (
                    <div key={`lbl-${day.toISOString()}`} style={{ flex: 1, textAlign: "center" }}>
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: dToday ? 700 : 500,
                          color: dToday ? BLUE : isPast ? TEXT_DISABLED : TEXT_SUBTLE,
                          letterSpacing: 0.2,
                          textTransform: "uppercase",
                        }}
                      >
                        {format(day, "EEE")}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Date row */}
              <div style={{ display: "flex" }}>
                {visibleDays.map((day) => {
                  const dToday = isSameDay(day, today);
                  const isPast = day < today && !dToday;
                  const dots = dotsByDay.get(format(day, "yyyy-MM-dd")) || [];
                  const hasEvent = dots.length > 0;
                  const eventColor = dots[0] ?? BLUE;
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => {
                        setSelectedDate(day);
                        if (!isSameMonth(day, viewMonth)) setViewMonth(day);
                      }}
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        padding: "3px 0",
                        display: "flex",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      aria-label={format(day, "EEEE d MMMM")}
                    >
                      <span
                        style={{
                          position: "relative",
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          background: dToday
                            ? BLUE
                            : hasEvent
                              ? eventColor + "20"
                              : "transparent",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: dToday ? 700 : hasEvent ? 600 : 500,
                            color: dToday
                              ? "#FFFFFF"
                              : isPast
                                ? TEXT_DISABLED
                                : TEXT,
                          }}
                        >
                          {format(day, "d")}
                        </span>
                        {hasEvent && !dToday && (
                          <span
                            style={{
                              position: "absolute",
                              bottom: 1,
                              left: "50%",
                              marginLeft: -2,
                              width: 4,
                              height: 4,
                              borderRadius: 2,
                              background: eventColor,
                            }}
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ height: 0.5, background: HAIRLINE }} />

            {/* Event list — max 3 */}
            <div>
              {showFallback && !isToday && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: TEXT_SUBTLE,
                    padding: "10px 14px 0",
                  }}
                >
                  No events on {format(selectedDate, "EEE d MMM")} · showing next up
                </div>
              )}
              {visibleEvents.slice(0, 3).map((e, idx, arr) => (
                <EventRow
                  key={e.id}
                  event={e}
                  isLast={idx === arr.length - 1}
                  onClick={() =>
                    navigate(`/instructor/events/${encodeURIComponent(e.id)}`)
                  }
                />
              ))}
            </div>

            {/* Footer */}
            <button
              onClick={goSeeAll}
              style={{
                width: "100%",
                borderTop: `0.5px solid ${HAIRLINE}`,
                padding: "9px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                background: "#FAFBFD",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: BLUE }}>
                See all events
              </span>
              <ChevronRight size={9} color={BLUE} strokeWidth={2.2} />
            </button>
          </>
        )}
      </div>

      <AddCalendarEventDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        instructorId={instructorId}
        onSuccess={() => {
          setAddOpen(false);
          queryClient.invalidateQueries({
            queryKey: ["upcoming-events-home", instructorId],
          });
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Event row                                                                  */
/* -------------------------------------------------------------------------- */

function EventRow({
  event,
  isLast,
  onClick,
}: {
  event: UpcomingEvent;
  isLast: boolean;
  onClick: () => void;
}) {
  const cfg = typeStyle[event.type];
  const Icon = cfg.icon;
  const pill = countdownStyle(event.daysUntil);

  return (
    <div>
      <button
        onClick={onClick}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {/* Icon tile */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: cfg.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={18} color={cfg.iconColor} strokeWidth={2} />
        </div>

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: TEXT,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              letterSpacing: -0.1,
            }}
          >
            {event.title}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: TEXT_SUBTLE,
              marginTop: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {event.dateLabel} · {event.timeLabel} · {event.locationLabel}
          </div>
        </div>

        {/* Countdown pill */}
        <div
          style={{
            background: pill.bg,
            borderRadius: 999,
            padding: "3px 9px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: pill.text,
              letterSpacing: 0.1,
            }}
          >
            {countdownLabel(event.daysUntil)}
          </span>
        </div>

        <ChevronRight size={14} color={TEXT_DISABLED} strokeWidth={2} />
      </button>

      {!isLast && (
        <div
          style={{
            height: 0.5,
            background: HAIRLINE,
            marginLeft: 66,
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* States                                                                     */
/* -------------------------------------------------------------------------- */

function LoadingState() {
  return (
    <div style={{ padding: "14px" }}>
      {/* Calendar skeleton */}
      <div
        style={{
          height: 22,
          width: 140,
          background: CHIP_BG,
          borderRadius: 6,
          margin: "0 auto 12px",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 28,
              height: 44,
              background: CHIP_BG,
              borderRadius: 8,
              opacity: 0.7,
            }}
          />
        ))}
      </div>
      <div style={{ height: 0.5, background: HAIRLINE, margin: "0 -14px 10px" }} />
      {/* Row skeletons */}
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 0",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: CHIP_BG,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 12,
                width: "60%",
                background: CHIP_BG,
                borderRadius: 4,
              }}
            />
            <div
              style={{
                height: 10,
                width: "40%",
                background: CHIP_BG,
                borderRadius: 4,
                marginTop: 6,
                opacity: 0.7,
              }}
            />
          </div>
          <div
            style={{
              width: 36,
              height: 18,
              borderRadius: 9,
              background: CHIP_BG,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      style={{
        padding: "28px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: BLUE_TINT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 4,
        }}
      >
        <CalendarIcon size={20} color={BLUE} strokeWidth={2} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>
        No upcoming events
      </div>
      <div
        style={{
          fontSize: 12,
          color: TEXT_SUBTLE,
          textAlign: "center",
          maxWidth: 260,
          lineHeight: 1.4,
        }}
      >
        Add meetings, reminders or instructor events to keep your week organised.
      </div>
      <button
        onClick={onAdd}
        style={{
          marginTop: 8,
          background: BLUE,
          border: "none",
          borderRadius: 999,
          padding: "8px 18px",
          fontSize: 13,
          fontWeight: 600,
          color: "#FFFFFF",
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(61,85,161,0.25)",
        }}
      >
        Add event
      </button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      style={{
        padding: "28px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "#FFE9EA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 4,
        }}
      >
        <AlertCircle size={20} color="#B23A3F" strokeWidth={2} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>
        Couldn't load events
      </div>
      <div style={{ fontSize: 12, color: TEXT_SUBTLE, textAlign: "center" }}>
        Try again
      </div>
      <button
        onClick={onRetry}
        style={{
          marginTop: 8,
          background: BLUE,
          border: "none",
          borderRadius: 999,
          padding: "8px 18px",
          fontSize: 13,
          fontWeight: 600,
          color: "#FFFFFF",
          cursor: "pointer",
        }}
      >
        Retry
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const circleBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 15,
  background: BLUE_TINT,
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
};
