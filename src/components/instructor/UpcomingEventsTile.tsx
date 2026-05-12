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
  Plus,
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
/* Tokens — aligned with bento mosaic (AttentionCard / UpgradeCard)           */
/* -------------------------------------------------------------------------- */

const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

const BLUE = "#3D55A1";
const BLUE_TINT = "#EDF2FE";
const TEXT = "#1A1A1A";
const MUTED = "#6B7280";
const HAIRLINE = "rgba(0,0,0,0.06)";

const typeMeta: Record<
  UpcomingEventType,
  { Icon: LucideIcon; color: string; tint: string; label: string }
> = {
  drivingTest:      { Icon: Car,           color: "#CC2229", tint: "rgba(204,34,41,0.08)",  label: "Driving test" },
  theoryTest:       { Icon: BookOpen,      color: "#1A52A0", tint: "rgba(26,82,160,0.08)",  label: "Theory test" },
  mot:              { Icon: Wrench,        color: "#1A7A3C", tint: "rgba(26,122,60,0.08)",  label: "MOT" },
  insuranceRenewal: { Icon: ShieldCheck,   color: "#1A7A3C", tint: "rgba(26,122,60,0.08)",  label: "Insurance" },
  task:             { Icon: ListTodo,      color: "#1A52A0", tint: "rgba(26,82,160,0.08)",  label: "Task" },
  training:         { Icon: GraduationCap, color: "#B45309", tint: "rgba(180,83,9,0.08)",   label: "Training" },
};

const friendlyDay = (d: Date) => {
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE d MMM");
};

/* -------------------------------------------------------------------------- */
/* Component — flat, no inner card; parent bento provides chrome              */
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
    <div style={{ fontFamily: FONT }}>
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : events.length === 0 ? (
        <EmptyState onAdd={() => setAddOpen(true)} />
      ) : (
        <>
          <div>
            {grouped.map(([key, dayEvents], gi) => {
              const d = dayEvents[0].date;
              const today = isToday(d);
              return (
                <div key={key}>
                  {/* Day header — minimal inline label */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: gi === 0 ? "0 0 6px" : "10px 0 6px",
                      borderTop: gi === 0 ? "none" : `0.5px solid ${HAIRLINE}`,
                      marginTop: gi === 0 ? 0 : 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: today ? BLUE : MUTED,
                      }}
                    >
                      {friendlyDay(d)}
                    </span>
                    {today && (
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          color: BLUE,
                          background: BLUE_TINT,
                          borderRadius: 999,
                          padding: "1px 7px",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                        }}
                      >
                        Today
                      </span>
                    )}
                  </div>

                  {dayEvents.map((e, i) => {
                    const m = typeMeta[e.type];
                    const Icon = m.Icon;
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
                          padding: "9px 0",
                          borderTop: i === 0 ? "none" : `0.5px solid ${HAIRLINE}`,
                          background: "transparent",
                          border: "none",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 9,
                            background: m.tint,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={15} color={m.color} strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13.5,
                              fontWeight: 600,
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
                              fontSize: 11.5,
                              color: MUTED,
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
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: TEXT,
                            fontVariantNumeric: "tabular-nums",
                            flexShrink: 0,
                          }}
                        >
                          {e.timeLabel}
                        </div>
                        <ChevronRight size={14} color="#C7C7CC" strokeWidth={2} />
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Footer actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
              paddingTop: 10,
              borderTop: `0.5px solid ${HAIRLINE}`,
            }}
          >
            <button
              onClick={() => setAddOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "transparent",
                border: "none",
                padding: 0,
                fontSize: 12.5,
                fontWeight: 600,
                color: MUTED,
                cursor: "pointer",
              }}
            >
              <Plus size={13} strokeWidth={2.2} />
              Add event
            </button>
            <span style={{ flex: 1 }} />
            <button
              onClick={goSeeAll}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                background: "transparent",
                border: "none",
                padding: 0,
                fontSize: 12.5,
                fontWeight: 600,
                color: BLUE,
                cursor: "pointer",
              }}
            >
              See all
              <ChevronRight size={13} strokeWidth={2.2} />
            </button>
          </div>
        </>
      )}

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
    <div>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 0",
            borderTop: i === 0 ? "none" : `0.5px solid ${HAIRLINE}`,
          }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "#F2F4F8" }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 11, width: "55%", background: "#F2F4F8", borderRadius: 4 }} />
            <div
              style={{
                height: 9,
                width: "35%",
                background: "#F2F4F8",
                borderRadius: 4,
                marginTop: 6,
                opacity: 0.7,
              }}
            />
          </div>
          <div style={{ width: 32, height: 11, borderRadius: 4, background: "#F2F4F8" }} />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      style={{
        padding: "16px 4px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: BLUE_TINT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <CalendarIcon size={18} color={BLUE} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: TEXT }}>
          Nothing scheduled
        </div>
        <div style={{ fontSize: 11.5, color: MUTED, marginTop: 1 }}>
          Add tests, MOT or training reminders.
        </div>
      </div>
      <button
        onClick={onAdd}
        style={{
          background: BLUE,
          border: "none",
          borderRadius: 999,
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: 600,
          color: "#FFFFFF",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          flexShrink: 0,
        }}
      >
        <Plus size={12} strokeWidth={2.4} />
        Add
      </button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      style={{
        padding: "16px 4px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: "rgba(178,58,63,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <AlertCircle size={18} color="#B23A3F" strokeWidth={2} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: TEXT }}>
          Couldn't load events
        </div>
        <div style={{ fontSize: 11.5, color: MUTED, marginTop: 1 }}>Tap retry to try again.</div>
      </div>
      <button
        onClick={onRetry}
        style={{
          background: BLUE,
          border: "none",
          borderRadius: 999,
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: 600,
          color: "#FFFFFF",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        Retry
      </button>
    </div>
  );
}
