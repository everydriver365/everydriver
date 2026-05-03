import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  addDays,
  format,
  isSameDay,
  startOfDay,
  subDays,
} from "date-fns";
import { useUpcomingEvents, UpcomingEvent, UpcomingEventType } from "@/hooks/useUpcomingEvents";
import { AddCalendarEventDialog } from "@/components/instructor/AddCalendarEventDialog";
import { useQueryClient } from "@tanstack/react-query";

const eventTypeConfig: Record<
  UpcomingEventType,
  { dotColor: string; pillBg: string; pillText: string; pilotLabel: (d: number) => string }
> = {
  drivingTest: { dotColor: "#B23A3F", pillBg: "#FFF0F0", pillText: "#B23A3F", pilotLabel: (d) => (d === 0 ? "Today" : `${d}d`) },
  theoryTest: { dotColor: "#B23A3F", pillBg: "#FFF0F0", pillText: "#B23A3F", pilotLabel: (d) => (d === 0 ? "Today" : `${d}d`) },
  mot: { dotColor: "#1A7A3C", pillBg: "#E8F8ED", pillText: "#1A7A3C", pilotLabel: (d) => (d === 0 ? "Today" : `${d}d`) },
  insuranceRenewal: { dotColor: "#1A7A3C", pillBg: "#E8F8ED", pillText: "#1A7A3C", pilotLabel: (d) => (d === 0 ? "Today" : `${d}d`) },
  task: { dotColor: "#B45309", pillBg: "#FFF6E6", pillText: "#B45309", pilotLabel: (d) => (d === 0 ? "Today" : `${d}d`) },
  training: { dotColor: "#6B21A8", pillBg: "#F0EEFF", pillText: "#6B21A8", pilotLabel: (d) => (d === 0 ? "Today" : `${d}d`) },
};

const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';
const ROW_BORDER = "#F0F3F8";
const BLUE = "#3D55A1";

interface Props {
  instructorId: string;
}

export function UpcomingEventsTile({ instructorId }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: events = [], isLoading } = useUpcomingEvents(instructorId);
  const [addOpen, setAddOpen] = useState(false);
  const [stripStart, setStripStart] = useState<Date>(() =>
    subDays(startOfDay(new Date()), 4),
  );

  const visibleDays = useMemo(
    () => Array.from({ length: 9 }, (_, i) => addDays(stripStart, i)),
    [stripStart],
  );

  const monthLabel = format(visibleDays[0], "MMMM yyyy");

  const dotsByDay = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const e of events) {
      const key = format(e.date, "yyyy-MM-dd");
      const arr = map.get(key) || [];
      const c = eventTypeConfig[e.type].dotColor;
      if (!arr.includes(c)) arr.push(c);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  const top4 = events.slice(0, 4);
  const today = startOfDay(new Date());

  const goSeeAll = () => navigate("/instructor/schedule");

  return (
    <div style={{ marginTop: 14, padding: "0 20px", fontFamily: FONT }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          padding: "0 2px",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#6B7A90",
            letterSpacing: "0.12em",
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
            color: "#315FAE",
            cursor: "pointer",
          }}
        >
          View all →
        </button>
      </div>

      {/* Card */}
      <div
        className="home-v2-card"
        style={{
          overflow: "hidden",
          marginBottom: 24,
          padding: 0,
        }}
      >
        {isLoading ? (
          <div style={{ padding: "10px 0" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: 32,
                  background: "#F2F4F8",
                  borderRadius: 8,
                  margin: "6px 12px",
                }}
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div
            style={{
              padding: "20px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <CalendarIcon size={24} color="#C7C7CC" strokeWidth={1.4} />
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", marginTop: 4 }}>
              Nothing coming up
            </div>
            <div style={{ fontSize: 10, color: "#8E8E93", textAlign: "center" }}>
              No tests, MOTs, tasks or training in the next 30 days
            </div>
            <button
              onClick={() => setAddOpen(true)}
              style={{
                marginTop: 4,
                background: "#EEF3FF",
                border: "none",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 11,
                fontWeight: 600,
                color: BLUE,
                cursor: "pointer",
              }}
            >
              Add event
            </button>
          </div>
        ) : (
          <>
            {/* Calendar strip */}
            <div style={{ padding: "10px 12px 8px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <button
                  onClick={() => setStripStart((d) => subDays(d, 7))}
                  style={stripBtn}
                  aria-label="Previous week"
                >
                  <ChevronLeft size={12} color="#5B6B8A" strokeWidth={1.8} />
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>
                    {monthLabel}
                  </span>
                  {!visibleDays.some((d) => isSameDay(d, today)) && (
                    <button
                      onClick={() => setStripStart(subDays(startOfDay(new Date()), 4))}
                      style={{
                        height: 22,
                        padding: "0 10px",
                        borderRadius: 11,
                        background: "#EEF3FF",
                        border: "none",
                        fontSize: 10,
                        fontWeight: 700,
                        color: BLUE,
                        cursor: "pointer",
                      }}
                      aria-label="Jump to today"
                    >
                      Today
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setStripStart((d) => addDays(d, 7))}
                  style={stripBtn}
                  aria-label="Next week"
                >
                  <ChevronRight size={12} color="#5B6B8A" strokeWidth={1.8} />
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {visibleDays.map((day) => {
                  const isT = isSameDay(day, today);
                  const isPastDay = day < today;
                  const dots = dotsByDay.get(format(day, "yyyy-MM-dd")) || [];
                  return (
                    <div
                      key={day.toISOString()}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: isT ? 700 : 500,
                          color: isT ? BLUE : isPastDay ? "#C7C7CC" : "#8E8E93",
                        }}
                      >
                        {format(day, "EEEEE")}
                      </span>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          background: isT ? BLUE : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: isT ? "#FFF" : isPastDay ? "#C7C7CC" : "#1A1A1A",
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
                              background: c,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ height: 0.5, background: ROW_BORDER }} />

            {/* Event list */}
            {top4.map((e, idx) => (
              <div key={e.id}>
                <button
                  onClick={() => navigate(`/instructor/events/${encodeURIComponent(e.id)}`)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: eventTypeConfig[e.type].dotColor,
                      flexShrink: 0,
                      marginLeft: 2,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#1A1A1A",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {e.title}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: "#8E8E93",
                        marginTop: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {e.dateLabel} · {e.timeLabel} · {e.locationLabel}
                    </div>
                  </div>
                  <div
                    style={{
                      background: eventTypeConfig[e.type].pillBg,
                      borderRadius: 20,
                      padding: "2px 7px",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: eventTypeConfig[e.type].pillText,
                      }}
                    >
                      {eventTypeConfig[e.type].pilotLabel(e.daysUntil)}
                    </span>
                  </div>
                  <ChevronRight size={12} color="#C7C7CC" strokeWidth={1.8} />
                </button>
                {idx < top4.length - 1 && (
                  <div
                    style={{
                      height: 0.5,
                      background: ROW_BORDER,
                      margin: "0 12px",
                    }}
                  />
                )}
              </div>
            ))}

            {/* Footer */}
            <button
              onClick={goSeeAll}
              style={{
                width: "100%",
                borderTop: `0.5px solid ${ROW_BORDER}`,
                padding: "8px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                background: "transparent",
                border: "none",
                borderTopWidth: 0.5,
                borderTopStyle: "solid",
                borderTopColor: ROW_BORDER,
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: BLUE }}>
                See all events
              </span>
              <ChevronRight size={12} color={BLUE} strokeWidth={1.8} />
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
          queryClient.invalidateQueries({ queryKey: ["upcoming-events-home", instructorId] });
        }}
      />
    </div>
  );
}

const stripBtn: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 11,
  background: "#F2F4F8",
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};
