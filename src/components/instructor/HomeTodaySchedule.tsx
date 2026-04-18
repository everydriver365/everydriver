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

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #fb923c, #ea580c)",
  "linear-gradient(135deg, #a78bfa, #7c3aed)",
  "linear-gradient(135deg, #f472b6, #db2777)",
  "linear-gradient(135deg, #2dd4bf, #0d9488)",
  "linear-gradient(135deg, #fbbf24, #d97706)",
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
        background: "#ffffff",
        borderRadius: 20,
        border: "1px solid #e5edf7",
        boxShadow: "0 4px 20px rgba(30,42,61,0.08)",
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
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              boxShadow: "0 2px 6px rgba(37,99,235,0.35)",
            }}
          >
            <Calendar size={14} color="#fff" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h3
              className="whitespace-nowrap"
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "-0.3px",
                color: "#1a1a1a",
                lineHeight: 1.2,
              }}
            >
              {isTomorrow ? "Tomorrow" : "Today's Schedule"}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span style={{ fontSize: 12, color: "#6b7280" }}>
                {dateLabel} · {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
              </span>
              {totalHours > 0 && (
                <span
                  style={{
                    background: "#ecfdf5",
                    color: "#047857",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                    padding: "2px 6px",
                    borderRadius: 6,
                  }}
                >
                  {totalHours}h total
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Today/Tomorrow toggle */}
        <div
          className="flex shrink-0"
          style={{
            background: "#f3f4f6",
            padding: 3,
            borderRadius: 18,
          }}
        >
          {(["today", "tomorrow"] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: active ? "#1e2a3d" : "transparent",
                  color: active ? "#fff" : "#6b7280",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: 15,
                  boxShadow: active ? "0 1px 3px rgba(30,42,61,0.25)" : "none",
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
            { label: "Completed", value: `${completedCount} / ${lessonCount}`, color: "#1a1a1a" },
            { label: "Earnings", value: `£${earnings}`, color: "#059669" },
            {
              label: "Next in",
              value: minutesUntilNext != null ? (minutesUntilNext >= 60 ? `${Math.floor(minutesUntilNext / 60)}h ${minutesUntilNext % 60}m` : `${minutesUntilNext}m`) : "—",
              color: "#2563eb",
            },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                background: "#f8fafc",
                border: "1px solid #eef2f7",
                borderRadius: 10,
                padding: "8px 10px",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: "0.6px",
                  textTransform: "uppercase",
                  color: "#9ca3af",
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
                background: "#f8fafc",
                border: "1px solid #eef2f7",
              }}
            >
              <CalendarX size={28} color="#cbd5e1" strokeWidth={1.8} />
            </div>
            <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 12 }}>
              No lessons scheduled
            </div>
            <button
              onClick={() => setAddOpen(true)}
              style={{
                background: "#1e2a3d",
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
            {/* Vertical connecting line */}
            <div
              style={{
                position: "absolute",
                left: 38 + 8 - 1, // time col (48 right-aligned approx) + gap; use 38 from spec
                top: 8,
                bottom: 8,
                width: 2,
                background: "#e5e7eb",
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
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", lineHeight: 1 }}>
                        {time.hour}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color: "#9ca3af",
                          letterSpacing: "0.5px",
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
                          background: isDone ? "#10b981" : "#fff",
                          border: isDone
                            ? "3px solid #10b981"
                            : isCurrent
                            ? "3px solid #2563eb"
                            : "3px solid #cbd5e1",
                          boxShadow: isCurrent ? "0 0 0 4px rgba(37,99,235,0.15)" : "none",
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
                          ? "linear-gradient(135deg, #eff6ff, #dbeafe)"
                          : "#f8fafc",
                        border: isCurrent ? "1px solid #bfdbfe" : "1px solid #eef2f7",
                        boxShadow: isCurrent ? "0 2px 8px rgba(37,99,235,0.10)" : "none",
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
                            color: "#1a1a1a",
                            textDecoration: isDone ? "line-through" : "none",
                            textDecorationColor: "#9ca3af",
                          }}
                        >
                          {lesson.pupilName}
                        </div>
                        {isCurrent && (
                          <span
                            style={{
                              background: "#fef3c7",
                              color: "#92400e",
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
                            background: isCurrent ? "#2563eb" : "#fff",
                            color: isCurrent ? "#fff" : "#1a1a1a",
                            border: isCurrent ? "none" : "1px solid #eef2f7",
                          }}
                        >
                          {durationLabel(lesson.durationMinutes)}
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-1.5 mt-1.5 truncate"
                        style={{ fontSize: 11, color: "#6b7280" }}
                      >
                        <MapPin size={11} strokeWidth={2} />
                        <span className="truncate">
                          {lesson.pickupPostcode || lesson.pickupLocation || "—"}
                        </span>
                        {lesson.amountDue != null && (
                          <>
                            <span style={{ color: "#cbd5e1" }}>·</span>
                            <span style={{ fontWeight: 600, color: "#1a1a1a" }}>
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
          borderTop: "1px solid #f3f4f6",
          padding: "10px 16px",
        }}
      >
        <Link
          to="/instructor/schedule"
          className="flex items-center gap-1"
          style={{ color: "#2563eb", fontSize: 12, fontWeight: 600 }}
        >
          View full calendar
          <ChevronRight size={14} strokeWidth={2.5} />
        </Link>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1"
          style={{
            background: "#1e2a3d",
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
