import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
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
import { format, isToday, isTomorrow } from "date-fns";
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
const TEXT_SUBTLE = "#8E8E93";
const TEXT_DISABLED = "#C7C7CC";
const HAIRLINE = "#F0F3F8";
const CARD_BORDER = "rgba(26,82,160,0.08)";
const CHIP_BG = "#F2F4F8";

const typeMeta: Record<
  UpcomingEventType,
  { Icon: LucideIcon; color: string; tint: string; label: string }
> = {
  drivingTest:      { Icon: Car,           color: "#CC2229", tint: "#FFF0F0", label: "Driving test" },
  theoryTest:       { Icon: BookOpen,      color: "#1A52A0", tint: "#EEF3FF", label: "Theory test" },
  mot:              { Icon: Wrench,        color: "#1A7A3C", tint: "#E8F8ED", label: "MOT" },
  insuranceRenewal: { Icon: ShieldCheck,   color: "#1A7A3C", tint: "#E8F8ED", label: "Insurance" },
  task:             { Icon: ListTodo,      color: "#1A52A0", tint: "#EEF3FF", label: "Task" },
  training:         { Icon: GraduationCap, color: "#B45309", tint: "#FFF6E6", label: "Training" },
};

const friendlyDay = (d: Date) => {
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE d MMM");
};

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

  const grouped = useMemo(() => {
    const map = new Map<string, UpcomingEvent[]>();
    for (const e of events) {
      const k = format(e.date, "yyyy-MM-dd");
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 4);
  }, [events]);

  const goSeeAll = () => navigate("/instructor/schedule");

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
            {grouped.map(([key, dayEvents], gi) => {
              const d = dayEvents[0].date;
              const today = isToday(d);
              return (
                <div key={key}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 14px",
                      background: today ? BLUE_TINT : "#FAFBFD",
                      borderTop: gi === 0 ? "none" : `0.5px solid ${HAIRLINE}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: 1.1,
                        textTransform: "uppercase",
                        color: today ? BLUE : "#6E6E73",
                      }}
                    >
                      {friendlyDay(d)}
                    </span>
                    <span style={{ flex: 1 }} />
                    <span style={{ fontSize: 10, color: TEXT_SUBTLE }}>
                      {dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {dayEvents.map((e, i) => {
                    const m = typeMeta[e.type];
                    return (
                      <button
                        key={e.id}
                        onClick={() =>
                          navigate(`/instructor/events/${encodeURIComponent(e.id)}`)
                        }
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 14px",
                          borderTop: i === 0 ? "none" : `0.5px solid ${HAIRLINE}`,
                          background: "transparent",
                          border: "none",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            textAlign: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            color: TEXT,
                            flexShrink: 0,
                          }}
                        >
                          {e.timeLabel}
                        </div>
                        <span
                          style={{
                            width: 3,
                            alignSelf: "stretch",
                            borderRadius: 2,
                            background: m.color,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: TEXT,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {e.title}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: TEXT_SUBTLE,
                              marginTop: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {m.label}
                            {e.locationLabel ? ` · ${e.locationLabel}` : ""}
                          </div>
                        </div>
                        <ChevronRight size={12} color={TEXT_DISABLED} strokeWidth={1.8} />
                      </button>
                    );
                  })}
                </div>
              );
            })}

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
                border: "none",
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
/* States                                                                     */
/* -------------------------------------------------------------------------- */

function LoadingState() {
  return (
    <div style={{ padding: "14px" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 0",
          }}
        >
          <div style={{ width: 44, height: 14, borderRadius: 4, background: CHIP_BG }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 12, width: "60%", background: CHIP_BG, borderRadius: 4 }} />
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
