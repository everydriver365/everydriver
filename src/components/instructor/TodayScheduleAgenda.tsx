import { useState } from "react";
import { format, parse, addDays } from "date-fns";
import { CalendarX, CheckCircle2, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { PupilAvatar } from "./PupilAvatar";
import { TodayLesson } from "@/hooks/useTodayRemainingLessons";

interface TodayScheduleAgendaProps {
  todayLessons: TodayLesson[];
  tomorrowLessons: TodayLesson[];
  className?: string;
}

const fmtTime24 = (t: string) => {
  try { return format(parse(t, "HH:mm:ss", new Date()), "HH:mm"); } catch { return t?.substring(0, 5); }
};

const typeColors: Record<string, { bg: string; text: string }> = {
  Standard: { bg: "rgba(10,122,255,0.08)", text: "#0A7AFF" },
  "Test Prep": { bg: "rgba(217,119,6,0.08)", text: "#D97706" },
  "Mock Test": { bg: "rgba(139,92,246,0.08)", text: "#8B5CF6" },
  Motorway: { bg: "rgba(48,209,88,0.08)", text: "#30D158" },
  Refresher: { bg: "rgba(236,72,153,0.08)", text: "#EC4899" },
  "Pass Plus": { bg: "rgba(14,165,233,0.08)", text: "#0EA5E9" },
};

function SummaryBar({ lessons }: { lessons: TodayLesson[] }) {
  const totalMins = lessons.reduce((s, l) => s + l.durationMinutes, 0);
  const totalEarnings = lessons.reduce((s, l) => s + (l.amountDue || 0), 0);
  const paid = lessons.filter(l => l.paymentStatus === "paid").length;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8E8E93", padding: "8px 16px 4px" }}>
      <span style={{ fontWeight: 600, color: "#000" }}>{lessons.length} lesson{lessons.length !== 1 ? "s" : ""}</span>
      <span>·</span>
      <span>{(totalMins / 60).toFixed(1)}h</span>
      <span>·</span>
      <span style={{ color: "#30D158" }}>£{Math.round(totalEarnings)}</span>
      <span>·</span>
      <span style={{ color: "#30D158" }}>{paid}/{lessons.length} paid</span>
    </div>
  );
}

function AgendaList({ lessons }: { lessons: TodayLesson[] }) {
  if (!lessons.length) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 16px", textAlign: "center" }}>
        <CalendarX style={{ height: 36, width: 36, color: "#C7C7CC", marginBottom: 8 }} />
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#8E8E93" }}>No lessons scheduled</p>
      </div>
    );
  }

  return (
    <div>
      <SummaryBar lessons={lessons} />
      <div>
        {lessons.map((l, i) => {
          const done = l.status === "completed";
          const colors = typeColors[l.lessonType] || typeColors.Standard;
          return (
            <Link key={l.id} to={l.pupilId ? `/instructor/pupils/${l.pupilId}` : "/instructor/pupils"} style={{ textDecoration: "none" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 16px",
                  borderBottom: i < lessons.length - 1 ? "0.5px solid #F2F2F7" : "none",
                  opacity: done ? 0.55 : 1,
                }}
              >
                {/* Time */}
                <div style={{ width: 44, flexShrink: 0, textAlign: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#000", lineHeight: 1 }}>{fmtTime24(l.startTime)}</span>
                  <div style={{ fontSize: 10, color: "#C7C7CC", marginTop: 2 }}>{l.durationMinutes}m</div>
                </div>

                {/* Divider */}
                <div style={{ width: 2, alignSelf: "stretch", borderRadius: 1, backgroundColor: colors.bg, flexShrink: 0 }} />

                {/* Avatar + Details */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                  <PupilAvatar name={l.pupilName} imageUrl={l.pupilProfileImageUrl} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#000",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                        textDecoration: done ? "line-through" : "none",
                      }}>
                        {l.pupilName}
                      </span>
                      {done && <CheckCircle2 style={{ height: 14, width: 14, color: "#30D158", flexShrink: 0 }} />}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#8E8E93", marginTop: 2, flexWrap: "wrap" as const }}>
                      {l.pickupPostcode && (
                        <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <MapPin style={{ height: 10, width: 10 }} />{l.pickupPostcode}
                        </span>
                      )}
                      <span style={{
                        display: "inline-block",
                        fontSize: 10,
                        fontWeight: 500,
                        padding: "1px 6px",
                        borderRadius: 4,
                        backgroundColor: colors.bg,
                        color: colors.text,
                      }}>
                        {l.lessonType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <span style={{
                  fontSize: 14,
                  fontWeight: 600,
                  flexShrink: 0,
                  color: l.paymentStatus === "paid" ? "#30D158" : "#D97706",
                }}>
                  £{l.amountDue || 0}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function TodayScheduleAgenda({ todayLessons, tomorrowLessons, className = "" }: TodayScheduleAgendaProps) {
  const [tab, setTab] = useState<"today" | "tomorrow">("today");
  const activeLessons = tab === "today" ? todayLessons : tomorrowLessons;

  return (
    <div
      className={className}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        border: "0.5px solid #E5E5EA",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        overflow: "hidden",
        fontFamily: "-apple-system, 'SF Pro Text', sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ padding: "14px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#000" }}>Today's Schedule</p>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#8E8E93" }}>
            {format(tab === "today" ? new Date() : addDays(new Date(), 1), "EEE d MMM")} · {activeLessons.length} lesson{activeLessons.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* iOS segmented control */}
        <div style={{ background: "#F2F2F7", borderRadius: 9, padding: 2, display: "flex" }}>
          {(["today", "tomorrow"] as const).map((val) => (
            <button
              key={val}
              onClick={() => setTab(val)}
              style={{
                border: "none",
                cursor: "pointer",
                borderRadius: 7,
                padding: "5px 14px",
                fontSize: 12,
                fontWeight: 600,
                background: tab === val ? "white" : "transparent",
                color: tab === val ? "#000" : "#8E8E93",
                boxShadow: tab === val ? "0 1px 2px rgba(0,0,0,0.12)" : "none",
                fontFamily: "inherit",
              }}
            >
              {val === "today" ? "Today" : "Tomorrow"}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 0.5, backgroundColor: "#F2F2F7" }} />

      {/* Lesson list */}
      <AgendaList lessons={activeLessons} />
    </div>
  );
}
