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

const BLUE = "#3D55A1";
const BLUE_TINT = "#EDF2FE";
const TEXT = "#1A1A1A";
const TEXT_MUTED = "#6E6E73";
const TEXT_SUBTLE = "#8E8E93";
const TEXT_DISABLED = "#C7C7CC";
const HAIRLINE = "rgba(60,60,67,0.10)";
const CARD_BORDER = "rgba(60,60,67,0.08)";
const CHIP_BG = "#F2F4F8";

/* Per-type icon styling */
const typeStyle: Record<
  UpcomingEventType,
  { icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; iconBg: string; iconColor: string }
> = {
  drivingTest:      { icon: Car,            iconBg: "#FFE9EA", iconColor: "#B23A3F" },
  theoryTest:       { icon: BookOpen,       iconBg: "#EAF1FF", iconColor: "#3D55A1" },
  mot:              { icon: Wrench,         iconBg: "#E6F6EC", iconColor: "#1A7A3C" },
  insuranceRenewal: { icon: ShieldCheck,    iconBg: "#E6F6EC", iconColor: "#1A7A3C" },
  task:             { icon: ListTodo,       iconBg: "#FFF4E0", iconColor: "#B45309" },
  training:         { icon: GraduationCap,  iconBg: "#F0EBFF", iconColor: "#6B21A8" },
};

/* Soft countdown pill colour by urgency */
function countdownStyle(daysUntil: number): { bg: string; text: string } {
  if (daysUntil <= 3) return { bg: "#FFE9EA", text: "#B23A3F" };
  if (daysUntil <= 14) return { bg: "#FFF1DD", text: "#B45309" };
  return { bg: "#E6F1EC", text: "#1A7A3C" };
}

function countdownLabel(d: number): string {
  if (d === 0) return "Today";
  if (d === 1) return "1d";
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

  const top4 = events.slice(0, 4);

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
          marginBottom: 10,
          padding: "0 4px",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: TEXT_MUTED,
            letterSpacing: 0.6,
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
            fontSize: 12,
            fontWeight: 600,
            color: BLUE,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          View all <ChevronRight size={12} color={BLUE} strokeWidth={2} />
        </button>
      </div>

      {/* Card */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          overflow: "hidden",
          border: `0.5px solid ${CARD_BORDER}`,
          boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 4px 16px rgba(16,24,40,0.04)",
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
            {/* PART 1: Mini calendar header */}
            <div style={{ padding: "14px 14px 10px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <button
                  onClick={handlePrevMonth}
                  style={circleBtn}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={14} color={BLUE} strokeWidth={2.2} />
                </button>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: TEXT,
                    letterSpacing: -0.1,
                  }}
                >
                  {monthLabel}
                </span>
                <button
                  onClick={handleNextMonth}
                  style={circleBtn}
                  aria-label="Next month"
                >
                  <ChevronRight size={14} color={BLUE} strokeWidth={2.2} />
                </button>
              </div>

              {/* Date strip */}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {visibleDays.map((day) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const isOutside = !isSameMonth(day, viewMonth);
                  const isPast = day < today && !isSameDay(day, today);
                  const dots = dotsByDay.get(format(day, "yyyy-MM-dd")) || [];

                  const weekdayColor = isSelected
                    ? BLUE
                    : isOutside || isPast
                      ? TEXT_DISABLED
                      : TEXT_SUBTLE;
                  const dateColor = isSelected
                    ? "#FFFFFF"
                    : isOutside || isPast
                      ? TEXT_DISABLED
                      : TEXT;

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
                        padding: "2px 0",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        cursor: "pointer",
                      }}
                      aria-label={format(day, "EEEE d MMMM")}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: weekdayColor,
                          letterSpacing: 0.2,
                        }}
                      >
                        {format(day, "EEEEE")}
                      </span>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          background: isSelected ? BLUE : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: isSelected
                            ? "0 2px 6px rgba(61,85,161,0.30)"
                            : "none",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: isSelected ? 700 : 500,
                            color: dateColor,
                          }}
                        >
                          {format(day, "d")}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 2, height: 4 }}>
                        {dots.slice(0, 3).map((c, i) => (
                          <div
                            key={i}
                            style={{
                              width: 4,
                              height: 4,
                              borderRadius: 2,
                              background: isSelected ? "#FFFFFF" : c,
                              opacity: isSelected ? 0.95 : 1,
                            }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ height: 0.5, background: HAIRLINE }} />

            {/* PART 2: Event list */}
            <div>
              {top4.map((e, idx) => (
                <EventRow
                  key={e.id}
                  event={e}
                  isLast={idx === top4.length - 1}
                  onClick={() =>
                    navigate(`/instructor/events/${encodeURIComponent(e.id)}`)
                  }
                />
              ))}
            </div>

            {/* PART 3: Footer */}
            <button
              onClick={goSeeAll}
              style={{
                width: "100%",
                borderTop: `0.5px solid ${HAIRLINE}`,
                padding: "12px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                background: "transparent",
                border: "none",
                borderTopWidth: 0.5,
                borderTopStyle: "solid",
                borderTopColor: HAIRLINE,
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: BLUE }}>
                See all events
              </span>
              <ChevronRight size={14} color={BLUE} strokeWidth={2} />
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
