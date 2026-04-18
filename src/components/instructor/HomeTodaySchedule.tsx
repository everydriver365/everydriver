import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  CalendarX,
  Check,
  ChevronRight,
  MapPin,
  Plus,
} from "lucide-react";
import { format, parse, addDays } from "date-fns";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { type TodayLesson } from "@/hooks/useTodayRemainingLessons";
import { useDayLessons } from "@/hooks/useDayLessons";
import { AddLessonSheet } from "@/components/instructor/AddLessonSheet";
import { useQueryClient } from "@tanstack/react-query";

interface HomeTodayScheduleProps {
  instructorId: string | undefined;
}

// Token-based avatar gradients (still distinctive but using HSL channels for theming)
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, hsl(25 95% 60%), hsl(20 91% 48%))",
  "linear-gradient(135deg, hsl(258 90% 70%), hsl(262 83% 58%))",
  "linear-gradient(135deg, hsl(330 81% 70%), hsl(336 78% 50%))",
  "linear-gradient(135deg, hsl(172 76% 55%), hsl(174 84% 32%))",
  "linear-gradient(135deg, hsl(43 96% 56%), hsl(35 92% 44%))",
];

function gradientFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

function fmtTime(time: string) {
  try {
    const d = parse(time, "HH:mm:ss", new Date());
    return { hour: format(d, "h:mm"), period: format(d, "a") };
  } catch {
    return { hour: time.slice(0, 5), period: "" };
  }
}

function durationLabel(mins: number) {
  const h = mins / 60;
  return h % 1 === 0 ? `${h}h` : `${h}h`;
}

type LessonState = "done" | "current" | "upcoming";

function deriveState(lesson: TodayLesson, nowSec: number, nextUpcomingId: string | null): LessonState {
  if (lesson.status === "completed") return "done";
  if (lesson.id === nextUpcomingId) return "current";
  return "upcoming";
}

// Semantic token shortcuts
const C = {
  surface: "hsl(var(--schedule-surface))",
  surfaceSoft: "hsl(var(--schedule-surface-soft))",
  border: "hsl(var(--schedule-border))",
  borderSoft: "hsl(var(--schedule-border-soft))",
  text: "hsl(var(--schedule-text))",
  textMuted: "hsl(var(--schedule-text-muted))",
  textSubtle: "hsl(var(--schedule-text-subtle))",
  accent: "hsl(var(--schedule-accent))",
  accentSoft: "hsl(var(--schedule-accent-soft))",
  accentDeep: "hsl(var(--schedule-accent-deep))",
  success: "hsl(var(--schedule-success))",
  successSoft: "hsl(var(--schedule-success-soft))",
  rail: "hsl(var(--schedule-rail))",
};

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
    return Math.max(0, Math.round((h * 60 + m) - (now.getHours() * 60 + now.getMinutes())));
  }, [lessons, nextUpcomingId, isTomorrow]);

  const dateLabel = format(targetDate, "EEE d MMM");
  const isLoading = (tab === "today" && overviewLoading) || lessonsLoading;
  const hasLessons = lessons.length > 0;

  const dayCompletedCount = lessons.filter((l) => l.status === "completed").length;
  const dayLessonCount = lessons.length;
  const dayTotalHours = lessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0) / 60;

  const completedCount = isTomorrow ? dayCompletedCount : (overview?.completedCount ?? 0);
  const lessonCount = isTomorrow ? dayLessonCount : (overview?.lessonCount ?? 0);
  const totalHours = isTomorrow ? dayTotalHours : (overview?.totalHours ?? 0);
  const earnings = overview?.expectedEarnings ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="font-sans"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        background: C.surface,
        borderRadius: 20,
        border: `1px solid ${C.border}`,
        boxShadow: "0 4px 20px hsl(var(--schedule-text) / 0.06)",
        maxWidth: 420,
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3" style={{ padding: "16px 18px" }}>
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${C.accent}, hsl(var(--schedule-accent) / 0.85))`,
              boxShadow: "0 2px 6px hsl(var(--schedule-accent) / 0.35)",
            }}
          >
            <Calendar size={14} color="#fff" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h3
              className="whitespace-nowrap"
              style={{
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: "-0.4px",
                color: C.text,
                lineHeight: 1.2,
              }}
            >
              {isTomorrow ? "Tomorrow" : "Today's Schedule"}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span style={{ fontSize: 13, color: C.textMuted }}>
                {dateLabel} · {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
              </span>
              {totalHours > 0 && (
                <span
                  style={{
                    background: C.successSoft,
                    color: C.success,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 7px",
                    borderRadius: 6,
                  }}
                >
                  {totalHours}h
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Today/Tomorrow toggle */}
        <div
          className="flex shrink-0"
          style={{
            background: C.surfaceSoft,
            padding: 3,
            borderRadius: 18,
            border: `1px solid ${C.borderSoft}`,
          }}
        >
          {(["today", "tomorrow"] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: active ? C.accentDeep : "transparent",
                  color: active ? "#fff" : C.textMuted,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: 15,
                  boxShadow: active ? "0 1px 3px hsl(var(--schedule-accent-deep) / 0.25)" : "none",
                  textTransform: "capitalize",
                  transition: "all 0.15s",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary strip */}
      {hasLessons && (
        <div className="grid grid-cols-3" style={{ gap: 8, margin: "0 16px 14px" }}>
          {[
            completedCount > 0
              ? { label: "Completed", value: `${completedCount} / ${lessonCount}`, color: C.text }
              : { label: "Lessons", value: `${lessonCount}`, color: C.text },
            { label: "Earnings", value: `£${earnings}`, color: C.success },
            {
              label: "Next in",
              value: minutesUntilNext != null ? (minutesUntilNext >= 60 ? `${Math.floor(minutesUntilNext / 60)}h ${minutesUntilNext % 60}m` : `${minutesUntilNext}m`) : "—",
              color: C.accent,
            },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                background: C.surfaceSoft,
                border: `1px solid ${C.borderSoft}`,
                borderRadius: 10,
                padding: "8px 10px",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  color: C.textSubtle,
                  fontWeight: 600,
                }}
              >
                {c.label}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: c.color, marginTop: 2 }}>
                {c.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div style={{ padding: "0 16px 8px" }}>
        {isLoading ? (
          <div className="space-y-3 animate-pulse py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-4 w-10 bg-muted rounded" />
                <div className="h-4 w-4 bg-muted rounded-full" />
                <div className="h-12 flex-1 bg-muted rounded-xl" />
              </div>
            ))}
          </div>
        ) : !hasLessons ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div
              className="flex items-center justify-center mb-3"
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: C.surfaceSoft,
                border: `1px solid ${C.borderSoft}`,
              }}
            >
              <CalendarX size={28} color={C.textSubtle} strokeWidth={1.8} />
            </div>
            <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 12 }}>
              No lessons scheduled
            </div>
            <button
              onClick={() => setAddOpen(true)}
              style={{
                background: C.accentDeep,
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                padding: "8px 14px",
                borderRadius: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Plus size={14} strokeWidth={2.5} /> Schedule a lesson
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical connecting line — aligned to status node column */}
            <div
              style={{
                position: "absolute",
                left: 48 + 8 + 8 - 1,
                top: 14,
                bottom: 14,
                width: 2,
                background: C.rail,
                zIndex: 0,
              }}
            />
            <div className="flex flex-col gap-2.5 py-1">
              {lessons.map((lesson) => {
                const state = deriveState(lesson, nowSec, nextUpcomingId);
                const time = fmtTime(lesson.startTime);
                const isCurrent = state === "current";
                const isDone = state === "done";
                const grad = gradientFor(lesson.pupilName);

                return (
                  <Link
                    key={lesson.id}
                    to={`/instructor/pupils/${lesson.pupilId}`}
                    className="flex items-stretch gap-2 relative"
                    style={{ zIndex: 1, opacity: isDone ? 0.6 : 1 }}
                  >
                    {/* Time column */}
                    <div
                      style={{
                        width: 48,
                        textAlign: "right",
                        flexShrink: 0,
                        paddingTop: 6,
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1 }}>
                        {time.hour}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: C.textSubtle,
                          letterSpacing: "0.4px",
                          marginTop: 2,
                        }}
                      >
                        {time.period}
                      </div>
                    </div>

                    {/* Status node */}
                    <div className="flex items-start justify-center shrink-0" style={{ width: 16, paddingTop: 8 }}>
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          background: isDone ? C.success : C.surface,
                          border: isDone
                            ? `3px solid ${C.success}`
                            : isCurrent
                            ? `3px solid ${C.accent}`
                            : `3px solid ${C.rail}`,
                          boxShadow: isCurrent ? `0 0 0 4px hsl(var(--schedule-accent) / 0.15)` : "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isDone && <Check size={9} color="#fff" strokeWidth={4} />}
                      </div>
                    </div>

                    {/* Lesson card */}
                    <div
                      className="flex-1 min-w-0"
                      style={{
                        borderRadius: 12,
                        padding: "10px 12px",
                        background: isCurrent
                          ? `linear-gradient(135deg, hsl(var(--schedule-accent-soft) / 0.6), hsl(var(--schedule-accent-soft)))`
                          : C.surfaceSoft,
                        border: `1px solid ${isCurrent ? C.accentSoft : C.borderSoft}`,
                        boxShadow: isCurrent ? `0 2px 8px hsl(var(--schedule-accent) / 0.10)` : "none",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="shrink-0 flex items-center justify-center text-white"
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: grad,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {lesson.pupilInitials.slice(0, 2)}
                        </div>
                        <div
                          className="flex-1 min-w-0 truncate"
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: C.text,
                            textDecoration: isDone ? "line-through" : "none",
                            textDecorationColor: C.textSubtle,
                          }}
                        >
                          {lesson.pupilName}
                        </div>
                        {isCurrent && (
                          <span
                            style={{
                              background: "hsl(45 93% 89%)",
                              color: "hsl(28 80% 28%)",
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: "0.4px",
                              padding: "2px 6px",
                              borderRadius: 5,
                              textTransform: "uppercase",
                            }}
                          >
                            Up Next
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 8,
                            background: isCurrent ? C.accent : C.surface,
                            color: isCurrent ? "#fff" : C.text,
                            border: isCurrent ? "none" : `1px solid ${C.borderSoft}`,
                          }}
                        >
                          {durationLabel(lesson.durationMinutes)}
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-1.5 mt-1.5 truncate"
                        style={{ fontSize: 11, color: C.textMuted }}
                      >
                        <MapPin size={11} strokeWidth={2} />
                        <span className="truncate">
                          {lesson.pickupPostcode || lesson.pickupLocation || "—"}
                        </span>
                        {lesson.amountDue != null && (
                          <>
                            <span style={{ color: C.textSubtle }}>·</span>
                            <span style={{ fontWeight: 600, color: C.text }}>
                              £{lesson.amountDue}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between"
        style={{
          borderTop: `1px solid ${C.borderSoft}`,
          padding: "10px 16px",
        }}
      >
        <Link
          to="/instructor/schedule"
          className="flex items-center gap-1"
          style={{ color: C.accent, fontSize: 12, fontWeight: 600 }}
        >
          View full calendar
          <ChevronRight size={14} strokeWidth={2.5} />
        </Link>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1"
          style={{
            background: C.accentDeep,
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 12px",
            borderRadius: 10,
          }}
        >
          <Plus size={13} strokeWidth={2.5} /> Add lesson
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
    </motion.div>
  );
}
