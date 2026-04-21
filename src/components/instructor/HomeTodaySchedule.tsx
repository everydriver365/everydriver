import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronRight, Plus } from "lucide-react";
import { format, parse, addDays } from "date-fns";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useDayLessons } from "@/hooks/useDayLessons";
import { AddLessonSheet } from "@/components/instructor/AddLessonSheet";
import { useQueryClient } from "@tanstack/react-query";
import { SectionHeader } from "@/components/instructor/SectionHeader";

interface HomeTodayScheduleProps {
  instructorId: string | undefined;
}

// Warm palette (matches global app theme)
const PAL = {
  paper: "#F7F5F0",
  trayBg: "#FAF8F3",
  trayBorder: "#E8E5DC",
  card: "#FFFFFF",
  hairline: "#D3D1C7",
  text: "#2C2C2A",
  textMuted: "#5F5E5A",
  textSubtle: "#888780",
  textNavyDeep: "#042C53",
  accentBlue: "#185FA5",
  accentBlueSoft: "#E6F1FB",
  accentBlueRing: "#B5D4F4",
  accentRed: "#A32D2D",
  accentGreen: "#0F6E56",
  accentGreenSoft: "#E1F5EE",
  avatarBg: "#F1EFE8",
  avatarText: "#5F5E5A",
  chipNeutralBg: "#F1EFE8",
  toggleActive: "#042C53",
};

function totalDurationLabel(mins: number): string {
  if (mins <= 0) return "0h";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m total`;
  if (m === 0) return `${h}h total`;
  return `${h}h ${m}m total`;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-GB");
}

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
        background: PAL.textSubtle,
        opacity: 0.18,
      }}
    />
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

  const minutesUntilNext = useMemo(() => {
    if (isTomorrow || !nextUpcomingId) return null;
    const next = lessons.find((l) => l.id === nextUpcomingId);
    if (!next) return null;
    const [h, m] = next.startTime.split(":").map(Number);
    return Math.max(0, Math.round(h * 60 + m - (now.getHours() * 60 + now.getMinutes())));
  }, [lessons, nextUpcomingId, isTomorrow]);

  const dateLabel = format(targetDate, "EEE d MMM");
  const isLoading = (tab === "today" && overviewLoading) || lessonsLoading;
  const hasLessons = lessons.length > 0;

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

  // Compact "next in" formatter: Nm / Nh / Nd
  const nextInLabel = (() => {
    if (isTomorrow) return null;
    if (minutesUntilNext == null) return null;
    if (minutesUntilNext < 60) return `${minutesUntilNext}m`;
    const hours = Math.round(minutesUntilNext / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.round(hours / 24)}d`;
  })();

  const totalMinutes = lessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

  return (
    <div
      style={{
        background: PAL.paper,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <div style={{ padding: "0 16px" }}>
        {/* ── White tray with navy header strip ── */}
        <div
          style={{
            background: PAL.card,
            border: `0.5px solid ${PAL.hairline}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {/* ── Navy header strip ── */}
          <div
            className="flex items-center"
            style={{
              background: PAL.textNavyDeep,
              padding: "10px 14px",
              gap: 10,
            }}
          >
            <Calendar size={14} strokeWidth={2} color="#B5D4F4" />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#FFFFFF" }}>
              {isTomorrow ? "Tomorrow's schedule" : "Today's schedule"}
            </span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#85B7EB" }}>
              {isLoading ? (
                <SkeletonBlock width={120} height={11} />
              ) : (
                `${dateLabel} · ${lessonCount} lesson${lessonCount === 1 ? "" : "s"}`
              )}
            </span>
          </div>

          {/* ── Inner content area ── */}
          <div style={{ padding: 12 }}>
          {/* ── Day toggle + duration chip ── */}
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <div
              className="flex shrink-0"
              style={{
                background: PAL.chipNeutralBg,
                borderRadius: 999,
                padding: 3,
              }}
            >
              {(["today", "tomorrow"] as const).map((t) => {
                const active = tab === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      background: active ? PAL.toggleActive : "transparent",
                      color: active ? "#FFFFFF" : PAL.textMuted,
                      fontSize: 11,
                      fontWeight: 500,
                      padding: "4px 10px",
                      borderRadius: 999,
                      transition: "all 0.15s",
                    }}
                  >
                    {t === "today" ? "Today" : "Tomorrow"}
                  </button>
                );
              })}
            </div>
            {!isLoading && totalMinutes > 0 && (
              <span
                style={{
                  background: PAL.accentBlueSoft,
                  color: PAL.accentBlue,
                  fontSize: 10,
                  fontWeight: 500,
                  padding: "3px 8px",
                  borderRadius: 999,
                }}
              >
                {totalDurationLabel(totalMinutes)}
              </span>
            )}
          </div>

          {/* ── Inline summary strip ── */}
          <div
            className="flex items-center"
            style={{
              gap: 14,
              paddingBottom: 10,
              marginBottom: 10,
              borderBottom: `0.5px solid ${PAL.trayBorder}`,
            }}
          >
            {isLoading ? (
              <SkeletonBlock width={180} height={16} />
            ) : (
              <>
                <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 500, color: PAL.textNavyDeep, lineHeight: 1 }}>
                    {lessonCount}
                  </span>
                  <span style={{ fontSize: 11, color: PAL.textSubtle }}>
                    {lessonCount === 1 ? "lesson" : "lessons"}
                  </span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 500, color: PAL.textNavyDeep, lineHeight: 1 }}>
                    £{formatCurrency(earnings)}
                  </span>
                  <span style={{ fontSize: 11, color: PAL.textSubtle }}>earned</span>
                </span>
                {nextInLabel && (
                  <span
                    style={{
                      marginLeft: "auto",
                      display: "inline-flex",
                      alignItems: "baseline",
                      gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 11, color: PAL.textSubtle }}>Next in</span>
                    <span style={{ fontSize: 16, fontWeight: 500, color: PAL.textNavyDeep, lineHeight: 1 }}>
                      {nextInLabel}
                    </span>
                  </span>
                )}
              </>
            )}
          </div>

          {/* ── Lesson timeline (no inner card — tray is the card) ── */}
          <div>

        {isLoading ? (
          <div className="flex flex-col" style={{ gap: 14 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center" style={{ gap: 14 }}>
                <div style={{ width: 44, textAlign: "right" }}>
                  <SkeletonBlock width={36} height={14} />
                </div>
                <div style={{ width: 10, display: "flex", justifyContent: "center" }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: PAL.hairline,
                      display: "inline-block",
                    }}
                  />
                </div>
                <div className="flex-1">
                  <SkeletonBlock width="60%" height={14} />
                  <div style={{ marginTop: 4 }}>
                    <SkeletonBlock width="40%" height={12} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !hasLessons ? (
          <div
            className="text-center"
            style={{ padding: "20px 0", fontSize: 13, color: PAL.textMuted }}
          >
            No lessons scheduled
          </div>
        ) : (
          <div className="relative">
            {lessons.map((lesson, idx) => {
              const time = fmtTime(lesson.startTime);
              const isLast = idx === lessons.length - 1;
              const initials = (lesson.pupilInitials || lesson.pupilName.slice(0, 2)).slice(0, 2).toUpperCase();
              const meta: string[] = [];
              if (lesson.pickupPostcode) meta.push(lesson.pickupPostcode);
              meta.push(`£${lesson.amountDue ?? 0} outstanding`);

              // Determine lesson state: done | overdue | next | upcoming
              const isDone = lesson.status === "completed";
              const [lh, lm] = lesson.startTime.split(":").map(Number);
              const startSec = lh * 3600 + lm * 60;
              const endSec = startSec + (lesson.durationMinutes || 0) * 60;
              const isOverdue = !isTomorrow && !isDone && nowSec > endSec;
              const isNext = !isTomorrow && lesson.id === nextUpcomingId;

              const markerBg = isDone
                ? PAL.accentGreen
                : isOverdue
                ? "#A86A1F"
                : PAL.accentBlue;

              return (
                <Link
                  key={lesson.id}
                  to={`/instructor/pupils/${lesson.pupilId}`}
                  className="flex"
                  style={{
                    gap: 14,
                    paddingTop: idx === 0 ? 0 : 12,
                    paddingBottom: 12,
                    opacity: isDone ? 0.55 : 1,
                  }}
                >
                  {/* Time column */}
                  <div
                    style={{
                      minWidth: 40,
                      textAlign: "right",
                      flexShrink: 0,
                      paddingTop: 2,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 500, color: PAL.textNavyDeep, lineHeight: 1 }}>
                      {time.hour}
                    </div>
                    {time.period && (
                      <div
                        style={{
                          fontSize: 9,
                          color: PAL.textSubtle,
                          letterSpacing: 0.5,
                          marginTop: 2,
                          fontWeight: 500,
                        }}
                      >
                        {time.period}
                      </div>
                    )}
                  </div>

                  {/* Spine column */}
                  <div
                    className="relative shrink-0 flex justify-center"
                    style={{ width: 10 }}
                  >
                    {/* Vertical line — stops at last marker */}
                    <span
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: isLast ? "calc(100% - 16px)" : 0,
                        width: 1,
                        background: PAL.hairline,
                        left: "50%",
                        transform: "translateX(-50%)",
                      }}
                    />
                    {/* Marker */}
                    <span
                      style={{
                        position: "relative",
                        marginTop: 6,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: markerBg,
                        border: "2px solid #FFFFFF",
                        boxShadow: `0 0 0 1px ${PAL.accentBlueRing}`,
                      }}
                    />
                  </div>

                  {/* Content column */}
                  <div className="flex-1 min-w-0 flex items-start" style={{ gap: 10 }}>
                    {/* Avatar */}
                    <div
                      className="shrink-0 flex items-center justify-center"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: PAL.avatarBg,
                        color: PAL.avatarText,
                        fontSize: 10,
                        fontWeight: 500,
                      }}
                    >
                      {initials}
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="truncate"
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: PAL.textNavyDeep,
                          lineHeight: 1.2,
                          textDecoration: isDone ? "line-through" : "none",
                        }}
                      >
                        {sentenceName(lesson.pupilName)}
                      </div>
                      <div
                        className="truncate"
                        style={{ fontSize: 11, color: PAL.textMuted, marginTop: 1 }}
                      >
                        {meta.join(" · ")}
                      </div>
                    </div>

                    {/* Status / Duration chip */}
                    {isNext ? (
                      <span
                        className="shrink-0"
                        style={{
                          fontSize: 10,
                          color: "#FFFFFF",
                          background: PAL.accentBlue,
                          padding: "2px 7px",
                          borderRadius: 999,
                          fontWeight: 600,
                          letterSpacing: 0.3,
                          textTransform: "uppercase",
                        }}
                      >
                        Next
                      </span>
                    ) : isOverdue ? (
                      <span
                        className="shrink-0"
                        style={{
                          fontSize: 10,
                          color: "#A86A1F",
                          background: "#FBEFD9",
                          padding: "2px 7px",
                          borderRadius: 999,
                          fontWeight: 600,
                        }}
                      >
                        End lesson
                      </span>
                    ) : isDone ? (
                      <span
                        className="shrink-0"
                        style={{
                          fontSize: 10,
                          color: PAL.accentGreen,
                          background: PAL.accentGreenSoft,
                          padding: "2px 7px",
                          borderRadius: 999,
                          fontWeight: 600,
                        }}
                      >
                        ✓ Done
                      </span>
                    ) : (
                      <span
                        className="shrink-0"
                        style={{
                          fontSize: 10,
                          color: PAL.textMuted,
                          background: PAL.chipNeutralBg,
                          padding: "2px 7px",
                          borderRadius: 999,
                          fontWeight: 500,
                        }}
                      >
                        {durationLabel(lesson.durationMinutes)}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}

          </div>
        )}
      </div>

          {/* ── Footer actions ── */}
          <div
            className="flex items-center justify-between"
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: `0.5px solid ${PAL.trayBorder}`,
            }}
          >
            <Link
              to="/instructor/schedule"
              className="flex items-center"
              style={{ color: PAL.accentBlue, fontSize: 12, fontWeight: 500, gap: 2 }}
            >
              View full calendar
              <ChevronRight size={12} strokeWidth={2} />
            </Link>
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center"
              style={{
                background: PAL.textNavyDeep,
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 500,
                padding: "7px 12px",
                borderRadius: 999,
                gap: 6,
              }}
            >
              <Plus size={12} strokeWidth={2} color="#FFFFFF" />
              Add lesson
            </button>
          </div>
          </div>
          {/* end inner content area */}
        </div>
        {/* end white tray */}

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
    </div>
  );
}
