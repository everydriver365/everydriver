import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Car,
  BookOpen,
  Wrench,
  ShieldCheck,
  ListTodo,
  GraduationCap,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format, isToday, isTomorrow, isSameDay } from "date-fns";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import {
  useUpcomingEvents,
  UpcomingEvent,
  UpcomingEventType,
} from "@/hooks/useUpcomingEvents";
import { UpcomingEventsTile } from "@/components/instructor/UpcomingEventsTile";

/* -------------------------------------------------------------------------- */
/* Tokens                                                                     */
/* -------------------------------------------------------------------------- */

const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

const BLUE = "#3D55A1";
const BLUE_TINT = "#EDF2FE";

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
/* Variant A — Spotlight + compact list                                       */
/* -------------------------------------------------------------------------- */

function VariantSpotlight({ events }: { events: UpcomingEvent[] }) {
  if (events.length === 0) return <EmptyVariant label="No upcoming events" />;
  const [hero, ...rest] = events;
  const hm = typeMeta[hero.type];

  return (
    <div
      style={{
        background: "#FFF",
        borderRadius: 18,
        overflow: "hidden",
        border: "0.5px solid rgba(26,82,160,0.08)",
      }}
    >
      {/* Hero */}
      <div
        style={{
          padding: 16,
          background: `linear-gradient(135deg, ${hm.tint} 0%, #FFFFFF 80%)`,
          borderBottom: "0.5px solid #F0F3F8",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Sparkles size={11} color={hm.color} strokeWidth={2.2} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: hm.color,
              letterSpacing: 1.1,
              textTransform: "uppercase",
            }}
          >
            Next up · {friendlyDay(hero.date)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: hm.color,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 6px 14px ${hm.color}33`,
            }}
          >
            <hm.Icon size={20} color="#FFF" strokeWidth={2} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>
              {hero.title}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                color: "#6E6E73",
                marginTop: 2,
              }}
            >
              <Clock size={10} strokeWidth={2} />
              {hero.timeLabel} · in {hero.daysUntil}d
            </div>
          </div>
        </div>
      </div>
      {/* Compact list */}
      {rest.slice(0, 3).map((e, i, arr) => {
        const m = typeMeta[e.type];
        return (
          <div key={e.id}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: m.tint,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <m.Icon size={13} color={m.color} strokeWidth={1.8} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#1A1A1A",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {e.title}
                </div>
                <div style={{ fontSize: 10, color: "#8E8E93", marginTop: 1 }}>
                  {friendlyDay(e.date)} · {e.timeLabel}
                </div>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: m.color,
                  background: m.tint,
                  borderRadius: 999,
                  padding: "2px 8px",
                }}
              >
                {e.daysUntil}d
              </span>
            </div>
            {i < arr.length - 1 && (
              <div style={{ height: 0.5, background: "#F0F3F8", margin: "0 14px" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Variant B — Horizontal day cards                                           */
/* -------------------------------------------------------------------------- */

function VariantDayCards({ events }: { events: UpcomingEvent[] }) {
  // Group events by day
  const byDay = useMemo(() => {
    const map = new Map<string, UpcomingEvent[]>();
    for (const e of events) {
      const k = format(e.date, "yyyy-MM-dd");
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 6);
  }, [events]);

  if (byDay.length === 0) return <EmptyVariant label="No upcoming events" />;

  return (
    <div
      style={{
        background: "#FFF",
        borderRadius: 18,
        border: "0.5px solid rgba(26,82,160,0.08)",
        padding: "14px 0 12px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: "0 14px",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {byDay.map(([key, dayEvents]) => {
          const d = dayEvents[0].date;
          const today = isToday(d);
          return (
            <div
              key={key}
              style={{
                minWidth: 140,
                background: today ? BLUE : "#F8F9FF",
                borderRadius: 14,
                padding: 12,
                border: today ? "none" : "0.5px solid #E6EBF5",
                color: today ? "#FFF" : "#1A1A1A",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  opacity: today ? 0.85 : 0.55,
                }}
              >
                {format(d, "EEE")}
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  lineHeight: 1,
                  margin: "4px 0 8px",
                  letterSpacing: -0.6,
                }}
              >
                {format(d, "d")}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {dayEvents.slice(0, 3).map((e) => {
                  const m = typeMeta[e.type];
                  return (
                    <div
                      key={e.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: today ? "rgba(255,255,255,0.16)" : "#FFF",
                        borderRadius: 8,
                        padding: "5px 7px",
                      }}
                    >
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          background: today ? "rgba(255,255,255,0.22)" : m.tint,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <m.Icon size={9} color={today ? "#FFF" : m.color} strokeWidth={2} />
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
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
                            opacity: today ? 0.85 : 0.55,
                          }}
                        >
                          {e.timeLabel}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      opacity: today ? 0.85 : 0.55,
                    }}
                  >
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Variant C — Vertical timeline                                              */
/* -------------------------------------------------------------------------- */

function VariantTimeline({ events }: { events: UpcomingEvent[] }) {
  if (events.length === 0) return <EmptyVariant label="No upcoming events" />;

  const list = events.slice(0, 5);

  return (
    <div
      style={{
        background: "#FFF",
        borderRadius: 18,
        border: "0.5px solid rgba(26,82,160,0.08)",
        padding: "14px 16px 6px",
      }}
    >
      <div style={{ position: "relative" }}>
        {/* Vertical rail */}
        <div
          style={{
            position: "absolute",
            left: 11,
            top: 8,
            bottom: 18,
            width: 1,
            background: "#E6EBF5",
          }}
        />
        {list.map((e, i) => {
          const m = typeMeta[e.type];
          const prev = i > 0 ? list[i - 1] : null;
          const sameDay = prev ? isSameDay(prev.date, e.date) : false;
          return (
            <div
              key={e.id}
              style={{ position: "relative", paddingLeft: 32, paddingBottom: 14 }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 2,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: "#FFF",
                  border: `2px solid ${m.color}`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <m.Icon size={10} color={m.color} strokeWidth={2.2} />
              </span>
              {!sameDay && (
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: m.color,
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                    marginBottom: 3,
                  }}
                >
                  {friendlyDay(e.date)} · {e.daysUntil}d
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>
                {e.title}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#6E6E73",
                  marginTop: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Clock size={10} strokeWidth={2} />
                {e.timeLabel}
                {e.locationLabel ? ` · ${e.locationLabel}` : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Variant D — Agenda list, grouped headers                                   */
/* -------------------------------------------------------------------------- */

function VariantAgenda({ events }: { events: UpcomingEvent[] }) {
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

  if (grouped.length === 0) return <EmptyVariant label="No upcoming events" />;

  return (
    <div
      style={{
        background: "#FFF",
        borderRadius: 18,
        border: "0.5px solid rgba(26,82,160,0.08)",
        overflow: "hidden",
      }}
    >
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
                borderTop: gi === 0 ? "none" : "0.5px solid #F0F3F8",
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
              <span style={{ fontSize: 10, color: "#8E8E93" }}>
                {dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}
              </span>
            </div>
            {dayEvents.map((e, i) => {
              const m = typeMeta[e.type];
              return (
                <div
                  key={e.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderTop: i === 0 ? "none" : "0.5px solid #F0F3F8",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      textAlign: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#1A1A1A",
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
                        color: "#1A1A1A",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {e.title}
                    </div>
                    <div style={{ fontSize: 10, color: "#8E8E93", marginTop: 1 }}>
                      {m.label}
                      {e.locationLabel ? ` · ${e.locationLabel}` : ""}
                    </div>
                  </div>
                  <ChevronRight size={12} color="#C7C7CC" strokeWidth={1.8} />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty / shared                                                             */
/* -------------------------------------------------------------------------- */

function EmptyVariant({ label }: { label: string }) {
  return (
    <div
      style={{
        background: "#FFF",
        borderRadius: 18,
        border: "0.5px solid rgba(26,82,160,0.08)",
        padding: "30px 16px",
        textAlign: "center",
        color: "#8E8E93",
        fontSize: 12,
      }}
    >
      <CalendarIcon size={20} color="#C7C7CC" style={{ marginBottom: 6 }} />
      <div>{label}</div>
    </div>
  );
}

function VariantFrame({
  letter,
  name,
  description,
  children,
}: {
  letter: string;
  name: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 22 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          padding: "0 4px",
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: BLUE,
            color: "#FFF",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {letter}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>{name}</div>
          <div style={{ fontSize: 11, color: "#6E6E73" }}>{description}</div>
        </div>
      </div>
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function UpcomingEventsRedesignDemo() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const instructorId = instructor?.id ?? "";
  const { data: events = [], isLoading } = useUpcomingEvents(instructorId);

  return (
    <div
      style={{
        background: "#F4F7F6",
        minHeight: "100vh",
        fontFamily: FONT,
        paddingBottom: 60,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(244,247,246,0.92)",
          backdropFilter: "blur(10px)",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "0.5px solid #E6EBF5",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            background: "#FFF",
            border: "0.5px solid #E6EBF5",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          aria-label="Back"
        >
          <ArrowLeft size={14} color="#1A1A1A" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>
            Upcoming events — redesign
          </div>
          <div style={{ fontSize: 11, color: "#6E6E73" }}>
            Live data · pick the layout you prefer
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 14px 0" }}>
        {isLoading && (
          <div style={{ fontSize: 12, color: "#8E8E93", padding: 8 }}>
            Loading your events…
          </div>
        )}

        <VariantFrame
          letter="0"
          name="Current design"
          description="The tile shipping on the home screen today."
        >
          <div style={{ margin: "0 -14px" }}>
            <UpcomingEventsTile instructorId={instructorId} />
          </div>
        </VariantFrame>

        <VariantFrame
          letter="A"
          name="Spotlight"
          description="Hero card for the next event, then a compact list of the next three."
        >
          <VariantSpotlight events={events} />
        </VariantFrame>

        <VariantFrame
          letter="B"
          name="Day cards"
          description="Horizontal scroll of date cards — see the next week at a glance."
        >
          <VariantDayCards events={events} />
        </VariantFrame>

        <VariantFrame
          letter="C"
          name="Timeline"
          description="Vertical timeline with coloured dots — emphasises sequence."
        >
          <VariantTimeline events={events} />
        </VariantFrame>

        <VariantFrame
          letter="D"
          name="Agenda"
          description="Grouped by day with time on the left — diary-style readability."
        >
          <VariantAgenda events={events} />
        </VariantFrame>
      </div>
    </div>
  );
}
