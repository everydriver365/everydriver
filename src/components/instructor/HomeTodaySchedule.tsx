import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronRight, Plus } from "lucide-react";
import { format, parse, addDays } from "date-fns";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useDayLessons } from "@/hooks/useDayLessons";
import { AddLessonSheet } from "@/components/instructor/AddLessonSheet";
import { useQueryClient } from "@tanstack/react-query";

interface HomeTodayScheduleProps {
  instructorId: string | undefined;
}

// Warm palette (matches global app theme)
const PAL = {
  paper: "#F7F5F0",
  card: "#FFFFFF",
  hairline: "#D3D1C7",
  text: "#2C2C2A",
  textMuted: "#5F5E5A",
  textSubtle: "#888780",
  accentBlue: "#185FA5",
  accentBlueSoft: "#E6F1FB",
  accentBlueRing: "#B5D4F4",
  accentRed: "#A32D2D",
  accentGreen: "#0F6E56",
  accentGreenSoft: "#E1F5EE",
  avatarBg: "#FAEEDA",
  avatarText: "#854F0B",
  chipNeutralBg: "#F1EFE8",
  toggleActive: "#2C2C2A",
};

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

  return (
    <div
      style={{
        background: PAL.paper,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {/* ── Section header (sits on warm paper, with day toggle as right slot) ── */}
      <SectionHeader
        title={isTomorrow ? "Tomorrow's schedule" : "Today's schedule"}
        category="schedule"
        rightSlot={
          <div
            className="flex shrink-0"
            style={{
              background: PAL.card,
              border: `0.5px solid ${PAL.hairline}`,
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
        }
      />

      <div style={{ padding: "0 16px" }}>

      {/* ── Date / summary line ── */}
      <div
        className="flex items-center"
        style={{ marginBottom: 14, gap: 8, flexWrap: "wrap" }}
      >
        {isLoading ? (
          <SkeletonBlock width={140} />
        ) : (
          <span style={{ fontSize: 12, color: PAL.textMuted }}>
            {dateLabel} · {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
          </span>
        )}
        {!isLoading && totalHours > 0 && (
          <span
            style={{
              background: PAL.accentGreenSoft,
              color: PAL.accentGreen,
              fontSize: 10,
              fontWeight: 500,
              padding: "2px 7px",
              borderRadius: 999,
            }}
          >
            {totalHoursLabel(totalHours)} total
          </span>
        )}
      </div>

      {/* ── Stats row (3 tiles) ── */}
      <div className="grid grid-cols-3" style={{ gap: 8, marginBottom: 14 }}>
        {[
          {
            label: "LESSONS",
            value: isLoading ? null : String(lessonCount),
            color: PAL.text,
          },
          {
            label: "EARNINGS",
            value: isLoading ? null : `£${earnings}`,
            color: PAL.accentGreen,
          },
          {
            label: "NEXT IN",
            value: isLoading ? null : nextInLabel ?? "—",
            color: nextInLabel ? PAL.text : PAL.textSubtle,
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: PAL.card,
              border: `0.5px solid ${PAL.hairline}`,
              borderRadius: 12,
              padding: 12,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: PAL.textSubtle,
                letterSpacing: 0.5,
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              {s.label}
            </div>
            {s.value == null ? (
              <SkeletonBlock width={48} height={20} />
            ) : (
              <div
                style={{ fontSize: 20, fontWeight: 500, color: s.color, lineHeight: 1 }}
              >
                {s.value}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Lesson timeline card ── */}
      <div
        style={{
          background: PAL.card,
          border: `0.5px solid ${PAL.hairline}`,
          borderRadius: 12,
          padding: "14px 16px",
          marginBottom: 14,
        }}
      >
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
              if (lesson.pickupPostcode || lesson.pickupLocation) {
                meta.push(lesson.pickupPostcode || lesson.pickupLocation || "");
              }
              meta.push(`£${lesson.amountDue ?? 0} outstanding`);

              return (
                <Link
                  key={lesson.id}
                  to={`/instructor/pupils/${lesson.pupilId}`}
                  className="flex"
                  style={{
                    gap: 14,
                    paddingTop: idx === 0 ? 0 : 12,
                    paddingBottom: 12,
                  }}
                >
                  {/* Time column */}
                  <div
                    style={{
                      minWidth: 44,
                      textAlign: "right",
                      flexShrink: 0,
                      paddingTop: 2,
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 500, color: PAL.text, lineHeight: 1 }}>
                      {time.hour}
                    </div>
                    {time.period && (
                      <div
                        style={{
                          fontSize: 10,
                          color: PAL.textSubtle,
                          letterSpacing: 0.5,
                          marginTop: 3,
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
                        background: PAL.accentBlue,
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
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: PAL.avatarBg,
                        color: PAL.avatarText,
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      {initials}
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="truncate"
                        style={{ fontSize: 14, fontWeight: 500, color: PAL.text, lineHeight: 1.2 }}
                      >
                        {sentenceName(lesson.pupilName)}
                      </div>
                      <div
                        className="truncate"
                        style={{ fontSize: 12, color: PAL.textMuted, marginTop: 2 }}
                      >
                        {meta.join(" · ")}
                      </div>
                    </div>

                    {/* Duration chip */}
                    <span
                      className="shrink-0"
                      style={{
                        fontSize: 11,
                        color: PAL.textMuted,
                        background: PAL.chipNeutralBg,
                        padding: "3px 8px",
                        borderRadius: 999,
                        fontWeight: 500,
                      }}
                    >
                      {durationLabel(lesson.durationMinutes)}
                    </span>
                  </div>
                </Link>
              );
            })}

            {/* End of day row */}
            <div className="flex items-center" style={{ gap: 14, paddingTop: 4 }}>
              <div style={{ minWidth: 44 }} />
              <div className="shrink-0 flex justify-center" style={{ width: 10 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: PAL.hairline,
                    display: "inline-block",
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: PAL.textSubtle }}>End of day</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer actions ── */}
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <Link
          to="/instructor/schedule"
          className="flex items-center"
          style={{ color: PAL.accentBlue, fontSize: 13, fontWeight: 500, gap: 4 }}
        >
          View full calendar
          <ChevronRight size={12} strokeWidth={2} />
        </Link>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center"
          style={{
            background: PAL.accentRed,
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: 500,
            padding: "8px 14px",
            borderRadius: 999,
            gap: 6,
          }}
        >
          <Plus size={12} strokeWidth={2} color="#FFFFFF" />
          Add lesson
        </button>
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
