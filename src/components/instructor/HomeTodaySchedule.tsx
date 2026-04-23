import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, parse, addDays } from "date-fns";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useDayLessons } from "@/hooks/useDayLessons";
import { AddLessonSheet } from "@/components/instructor/AddLessonSheet";
import { useQueryClient } from "@tanstack/react-query";

interface HomeTodayScheduleProps {
  instructorId: string | undefined;
}

// iOS 17 tokens — scoped to this card via inline styles
const IOS = {
  label: "#000000",
  secondaryLabel: "rgba(60,60,67,.60)",
  tertiaryLabel: "rgba(60,60,67,.30)",
  opaqueSeparator: "#C6C6C8",
  fill: "rgba(120,120,128,.12)",
  secondaryFill: "rgba(120,120,128,.08)",
  tertiaryFill: "rgba(118,118,128,.12)",
  systemBlue: "#007AFF",
  systemGreen: "#34C759",
  card: "#FFFFFF",
  secondaryBg: "#F2F2F7",
};

const IOS_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', sans-serif";

function fmtTime(time: string) {
  try {
    const d = parse(time, "HH:mm:ss", new Date());
    return { hour: format(d, "h:mm"), period: format(d, "a").toUpperCase() };
  } catch {
    return { hour: time.slice(0, 5), period: "" };
  }
}

function durationLabel(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = mins / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

function totalHoursLabel(hours: number): string {
  if (hours <= 0) return "0h";
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

function sentenceName(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function SkeletonBlock({ width, height = 12 }: { width: number | string; height?: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        width,
        height,
        borderRadius: 4,
        background: IOS.tertiaryLabel,
        opacity: 0.5,
      }}
    />
  );
}

// SF Symbol-style inline SVGs
function CalendarIcon({ size = 16, color = "#fff", strokeWidth = 2.4 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

function PoundIcon({ size = 16, color = "#fff", strokeWidth = 2.4 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 6.5a4 4 0 0 0-7.5 1.9V13H6M6 13h8M16 19H6c1.5-1 2.5-2.5 2.5-5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width={7} height={13} viewBox="0 0 7 13" fill="none" stroke={IOS.systemBlue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 1.5 5.5 6.5 1 11.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function HomeTodaySchedule({ instructorId }: HomeTodayScheduleProps) {
  const [tab, setTab] = useState<"today" | "tomorrow">("today");
  const [addOpen, setAddOpen] = useState(false);
  const queryClient = useQueryClient();

  const now = new Date();
  const targetDate = tab === "today" ? now : addDays(now, 1);
  const isTomorrow = tab === "tomorrow";

  const { data: overview, isLoading: overviewLoading } = useTodayOverview(instructorId);
  const { data: lessons = [], isLoading: lessonsLoading } = useDayLessons(instructorId, targetDate);

  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60;

  const nextUpcomingId = useMemo(() => {
    if (isTomorrow) {
      const first = lessons.find((l) => l.status !== "completed");
      return first?.id || null;
    }
    const upcoming = lessons.find((l) => {
      if (l.status === "completed") return false;
      const [h, m] = l.startTime.split(":").map(Number);
      return h * 3600 + m * 60 >= nowSec;
    });
    return upcoming?.id || null;
  }, [lessons, nowSec, isTomorrow]);

  const dayLessonCount = lessons.length;
  const dayTotalHours = lessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0) / 60;
  const dayAmountDueSum = lessons.reduce((sum, l) => sum + (l.amountDue ?? 0), 0);
  const dayHasAnyAmount = lessons.some((l) => l.amountDue != null && l.amountDue > 0);

  const lessonCount = isTomorrow ? dayLessonCount : (overview?.lessonCount ?? 0);
  const totalHours = isTomorrow ? dayTotalHours : (overview?.totalHours ?? 0);

  const derivedHourlyRate =
    overview && overview.totalHours > 0 ? overview.expectedEarnings / overview.totalHours : 35;
  const earnings = dayHasAnyAmount
    ? Math.round(dayAmountDueSum)
    : isTomorrow
    ? Math.round(dayTotalHours * derivedHourlyRate)
    : Math.round(overview?.expectedEarnings ?? 0);

  const dayName = format(targetDate, "EEEE");
  const dateLabel = format(targetDate, "d MMMM");
  const isLoading = (tab === "today" && overviewLoading) || lessonsLoading;
  const hasLessons = lessons.length > 0;

  const subtitle = isLoading
    ? ""
    : hasLessons
    ? `${dateLabel} · ${lessonCount} lesson${lessonCount === 1 ? "" : "s"} · ${totalHoursLabel(totalHours)}`
    : `${dateLabel} · No lessons yet`;

  return (
    <div
      style={{
        padding: "0 16px",
        fontFamily: IOS_FONT,
        WebkitFontSmoothing: "antialiased",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <style>{`
        @keyframes hts-pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(0,122,255,.18); }
          50% { box-shadow: 0 0 0 6px rgba(0,122,255,.08); }
        }
        .hts-row:hover { background: ${IOS.secondaryFill}; }
        .hts-row:active, .hts-link:active, .hts-add:active { opacity: 0.8; }
        .hts-add:active { transform: scale(0.98); }
        .hts-add:hover { background: #0071EB; }
        @media (prefers-reduced-motion: reduce) {
          .hts-pulse { animation: none !important; }
        }
        @media (max-width: 320px) {
          .hts-stats { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div
        style={{
          maxWidth: 440,
          margin: "0 auto",
          background: IOS.card,
          borderRadius: 14,
          boxShadow: "0 1px 0 rgba(0,0,0,.02), 0 20px 40px -20px rgba(15,23,42,.08)",
          overflow: "hidden",
          color: IOS.label,
        }}
      >
        {/* HEAD */}
        <div
          style={{
            padding: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: IOS.systemBlue,
                letterSpacing: -0.08,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: IOS.systemBlue }} />
              {isTomorrow ? "Tomorrow's schedule" : "Today's schedule"}
            </span>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.26, lineHeight: 1.1, color: IOS.label }}>
              {dayName}
            </span>
            <span style={{ fontSize: 13, color: IOS.secondaryLabel, letterSpacing: -0.08 }}>
              {isLoading ? <SkeletonBlock width={160} height={12} /> : subtitle}
            </span>
          </div>
          <span
            style={{
              flexShrink: 0,
              background: IOS.fill,
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 13,
              color: IOS.label,
              letterSpacing: -0.08,
            }}
          >
            <span style={{ fontWeight: 700 }}>{lessonCount}</span>
            <span style={{ color: IOS.secondaryLabel }}> lessons</span>
          </span>
        </div>

        {/* SEGMENTED CONTROL */}
        <div
          style={{
            margin: "0 16px 16px",
            padding: 2,
            background: IOS.tertiaryFill,
            borderRadius: 9,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
            position: "relative",
          }}
        >
          {(["today", "tomorrow"] as const).map((t, i) => {
            const active = tab === t;
            const otherActive = tab !== t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  position: "relative",
                  padding: "7px 12px",
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: IOS.label,
                  background: active ? "#FFFFFF" : "transparent",
                  boxShadow: active ? "0 3px 8px rgba(0,0,0,.12), 0 1px 1px rgba(0,0,0,.04)" : "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s cubic-bezier(0.2,0.7,0.2,1)",
                  letterSpacing: -0.08,
                  fontFamily: IOS_FONT,
                }}
              >
                {t === "today" ? "Today" : "Tomorrow"}
                {i === 0 && otherActive && (
                  <span
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "20%",
                      bottom: "20%",
                      width: 1,
                      background: IOS.opaqueSeparator,
                      opacity: 0.55,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* STATS ROW */}
        <div
          className="hts-stats"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            padding: "0 16px 14px",
          }}
        >
          {/* Tile 1 — Lessons */}
          <div
            style={{
              background: IOS.secondaryBg,
              borderRadius: 10,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: IOS.systemBlue,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <CalendarIcon size={16} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: IOS.label, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
                {isLoading ? <SkeletonBlock width={28} height={18} /> : lessonCount}
              </div>
              <div style={{ fontSize: 12, color: IOS.secondaryLabel, marginTop: 2 }}>
                {lessonCount > 0 ? `lessons · ${totalHoursLabel(totalHours)}` : "lessons"}
              </div>
            </div>
          </div>

          {/* Tile 2 — Earnings */}
          <div
            style={{
              background: IOS.secondaryBg,
              borderRadius: 10,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: IOS.systemGreen,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <PoundIcon size={16} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: IOS.label, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
                {isLoading ? <SkeletonBlock width={42} height={18} /> : `£${earnings.toLocaleString("en-GB")}`}
              </div>
              <div style={{ fontSize: 12, color: IOS.secondaryLabel, marginTop: 2 }}>earned today</div>
            </div>
          </div>
        </div>

        {/* BODY */}
        {isLoading ? (
          <div style={{ borderTop: `0.5px solid ${IOS.opaqueSeparator}`, padding: "16px" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "10px 0" }}>
                <SkeletonBlock width={40} height={18} />
                <div style={{ flex: 1 }}>
                  <SkeletonBlock width="55%" height={14} />
                  <div style={{ marginTop: 6 }}>
                    <SkeletonBlock width="35%" height={11} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !hasLessons ? (
          <div
            style={{
              borderTop: `0.5px solid ${IOS.opaqueSeparator}`,
              padding: "32px 16px 28px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: IOS.secondaryBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CalendarIcon size={24} color={IOS.tertiaryLabel} strokeWidth={1.8} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: IOS.label, letterSpacing: -0.24 }}>
              No lessons scheduled
            </div>
            <div style={{ fontSize: 13, color: IOS.secondaryLabel, maxWidth: 240, lineHeight: 1.4, letterSpacing: -0.08 }}>
              Add a lesson to your calendar to start tracking your day
            </div>
          </div>
        ) : (
          <div style={{ borderTop: `0.5px solid ${IOS.opaqueSeparator}` }}>
            {lessons.map((lesson, idx) => {
              const time = fmtTime(lesson.startTime);
              const isDone = lesson.status === "completed";
              const isNext = !isTomorrow && lesson.id === nextUpcomingId;
              const isUpcoming = !isDone && !isNext;

              const dotColor = isDone
                ? IOS.tertiaryLabel
                : isNext
                ? IOS.systemBlue
                : IOS.systemGreen;

              const haloShadow = isDone
                ? "none"
                : isNext
                ? "0 0 0 3px rgba(0,122,255,.18)"
                : "0 0 0 3px rgba(52,199,89,.15)";

              const meta: string[] = [];
              if ((lesson as any).transmission) meta.push((lesson as any).transmission);
              if (lesson.pickupPostcode) meta.push(lesson.pickupPostcode);

              return (
                <Link
                  key={lesson.id}
                  to={`/instructor/pupils/${lesson.pupilId}`}
                  className="hts-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "50px 1fr 16px",
                    alignItems: "center",
                    gap: 0,
                    padding: "12px 16px",
                    cursor: "pointer",
                    textDecoration: "none",
                    color: "inherit",
                    borderTop: idx === 0 ? "none" : `0.5px solid ${IOS.opaqueSeparator}`,
                    borderTopLeftRadius: 0,
                    transition: "background 0.15s cubic-bezier(0.2,0.7,0.2,1)",
                    opacity: isDone ? 0.6 : 1,
                    position: "relative",
                  }}
                >
                  {/* Indented separator effect — handled by border above starting at col 1; for spec's "x=80px" indent we override the first row only */}
                  {idx > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -0.5,
                        left: 80,
                        right: 0,
                        height: 0.5,
                        background: IOS.opaqueSeparator,
                      }}
                    />
                  )}

                  {/* Time column */}
                  <div
                    style={{
                      paddingRight: 14,
                      borderRight: `1px solid ${IOS.opaqueSeparator}`,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 600,
                        color: IOS.label,
                        letterSpacing: -0.24,
                        fontVariantNumeric: "tabular-nums",
                        lineHeight: 1.1,
                      }}
                    >
                      {time.hour}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: IOS.secondaryLabel,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 0.3,
                        marginTop: 2,
                      }}
                    >
                      {time.period}
                      {lesson.durationMinutes ? ` · ${durationLabel(lesson.durationMinutes)}` : ""}
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ minWidth: 0, paddingLeft: 14 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: IOS.label,
                        letterSpacing: -0.24,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        textDecoration: isDone ? "line-through" : "none",
                      }}
                    >
                      {sentenceName(lesson.pupilName)}
                    </div>
                    {meta.length > 0 && (
                      <div
                        style={{
                          fontSize: 13,
                          color: IOS.secondaryLabel,
                          marginTop: 2,
                          letterSpacing: -0.08,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {meta.join(" · ")}
                      </div>
                    )}
                  </div>

                  {/* Status dot */}
                  <span
                    className={isNext ? "hts-pulse" : ""}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: dotColor,
                      boxShadow: haloShadow,
                      flexShrink: 0,
                      justifySelf: "center",
                      animation: isNext ? "hts-pulse 2s infinite" : "none",
                    }}
                  />
                </Link>
              );
            })}
          </div>
        )}

        {/* FOOTER */}
        <div
          style={{
            padding: "14px 16px",
            borderTop: `0.5px solid ${IOS.opaqueSeparator}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Link
            to="/instructor/schedule"
            className="hts-link"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: IOS.systemBlue,
              fontSize: 15,
              fontWeight: 400,
              letterSpacing: -0.24,
              textDecoration: "none",
              transition: "opacity 0.15s",
            }}
          >
            View full calendar
            <ChevronIcon />
          </Link>
          <button
            onClick={() => setAddOpen(true)}
            className="hts-add"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: IOS.systemBlue,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 999,
              padding: "10px 18px 10px 14px",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: -0.24,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,122,255,.2)",
              transition: "all 0.15s cubic-bezier(0.2,0.7,0.2,1)",
              fontFamily: IOS_FONT,
            }}
          >
            <PlusIcon />
            Add lesson
          </button>
        </div>
      </div>

      {instructorId && (
        <AddLessonSheet
          open={addOpen}
          onOpenChange={setAddOpen}
          instructorId={instructorId}
          defaultDate={new Date()}
          onSuccess={() => {
            setAddOpen(false);
            queryClient.invalidateQueries({ queryKey: ["today-remaining-lessons"] });
            queryClient.invalidateQueries({ queryKey: ["today-overview"] });
          }}
        />
      )}
    </div>
  );
}
