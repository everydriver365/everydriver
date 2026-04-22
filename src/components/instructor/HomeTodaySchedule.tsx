import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Plus, ArrowRight } from "lucide-react";
import { format, parse, addDays, getISOWeek, startOfWeek } from "date-fns";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useDayLessons } from "@/hooks/useDayLessons";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { AddLessonSheet } from "@/components/instructor/AddLessonSheet";
import { useQueryClient } from "@tanstack/react-query";
import type { TodayLesson } from "@/hooks/useTodayRemainingLessons";

interface HomeTodayScheduleProps {
  instructorId: string | undefined;
}

const C = {
  ink: "#0f1724",
  inkSoft: "#4b5565",
  inkMute: "#8794a7",
  line: "#eaeef5",
  lineSoft: "#f2f4f9",
  brand: "#1e3a8a",
  brand2: "#3b5fd4",
  amber: "#f59e0b",
  emerald: "#10b981",
  rose: "#f43f5e",
  badgeBlueBg: "#dbeafe",
  badgeBlueText: "#1e40af",
  footerBg: "#fafbfd",
  emptyHeroFrom: "#f0f4ff",
  emptyHeroTo: "#f8faff",
};

const MANROPE = "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

function categoryFor(lessonType: string): "amber" | "rose" | "emerald" {
  const t = (lessonType || "").toLowerCase();
  if (t.includes("test prep")) return "amber";
  if (t.includes("mock")) return "rose";
  return "emerald";
}

function fmtTime(time: string): string {
  try {
    const d = parse(time, "HH:mm:ss", new Date());
    return format(d, "HH:mm");
  } catch {
    return time.slice(0, 5);
  }
}

function durationLabel(mins: number): string {
  return `${mins} min`;
}

function sentenceName(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function Shimmer({ width = "100%", height = 12 }: { width?: number | string; height?: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        width,
        height,
        borderRadius: 4,
        background: C.line,
        opacity: 0.7,
      }}
    />
  );
}

function LessonRow({
  lesson,
  onClick,
}: {
  lesson: TodayLesson;
  onClick: () => void;
}) {
  const cat = categoryFor(lesson.lessonType);
  const barColor = cat === "amber" ? C.amber : cat === "rose" ? C.rose : C.emerald;
  const meta: string[] = [];
  if (lesson.pickupPostcode) meta.push(lesson.pickupPostcode);
  meta.push(lesson.lessonType || "Standard");
  meta.push(lesson.paymentStatus === "paid" ? "Paid" : "Unpaid");

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center text-left transition-colors duration-150"
      style={{
        gap: 12,
        padding: "10px 8px",
        borderRadius: 10,
        background: "transparent",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = C.lineSoft)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Time column */}
      <div style={{ width: 54, flexShrink: 0 }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 13,
            fontWeight: 700,
            color: C.ink,
            lineHeight: 1.1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {fmtTime(lesson.startTime)}
        </div>
        <div
          style={{
            fontSize: 10,
            color: C.inkMute,
            marginTop: 2,
            fontFamily: MANROPE,
          }}
        >
          {durationLabel(lesson.durationMinutes)}
        </div>
      </div>

      {/* Category bar */}
      <span
        style={{
          width: 3,
          height: 32,
          borderRadius: 2,
          background: barColor,
          flexShrink: 0,
        }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div
          className="truncate"
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: C.ink,
            fontFamily: MANROPE,
            lineHeight: 1.2,
          }}
        >
          {sentenceName(lesson.pupilName)} — {lesson.lessonType || "Standard"}
        </div>
        <div
          className="truncate"
          style={{
            fontSize: 11.5,
            color: C.inkSoft,
            marginTop: 2,
            fontFamily: MANROPE,
          }}
        >
          {meta.join(" · ")}
        </div>
      </div>

      {/* Price */}
      <div
        style={{
          fontFamily: MONO,
          fontSize: 13,
          fontWeight: 500,
          color: C.ink,
          flexShrink: 0,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        £{Math.round(lesson.amountDue ?? 0)}
      </div>
    </button>
  );
}

function DayHeaderStrip({
  label,
  count,
  variant = "default",
}: {
  label: string;
  count: number;
  variant?: "default" | "preview";
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        background: variant === "preview" ? C.lineSoft : "transparent",
        padding: variant === "preview" ? "8px 12px" : "4px 8px",
        borderRadius: 8,
        marginBottom: 4,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: C.inkSoft,
          fontFamily: MANROPE,
        }}
      >
        {label}
      </span>
      <span
        style={{
          background: C.badgeBlueBg,
          color: C.badgeBlueText,
          fontFamily: MONO,
          fontSize: 11,
          fontWeight: 500,
          padding: "2px 8px",
          borderRadius: 999,
        }}
      >
        {count}
      </span>
    </div>
  );
}

export function HomeTodaySchedule({ instructorId }: HomeTodayScheduleProps) {
  const [activeTab, setActiveTab] = useState<"today" | "tomorrow" | "week">("today");
  const [addOpen, setAddOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const now = new Date();
  const tomorrowDate = addDays(now, 1);

  // Week (Mon–Sun)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart.toISOString()],
  );

  const { data: overview, isLoading: overviewLoading } = useTodayOverview(instructorId);
  const { data: weeklyGoals } = useWeeklyGoals(instructorId);
  const { data: todayLessons = [], isLoading: todayLoading } = useDayLessons(instructorId, now);
  const { data: tomorrowLessons = [], isLoading: tomorrowLoading } = useDayLessons(
    instructorId,
    tomorrowDate,
  );

  // Week — call hook 7 times (rules-of-hooks safe: stable length)
  const d0 = useDayLessons(instructorId, weekDates[0]);
  const d1 = useDayLessons(instructorId, weekDates[1]);
  const d2 = useDayLessons(instructorId, weekDates[2]);
  const d3 = useDayLessons(instructorId, weekDates[3]);
  const d4 = useDayLessons(instructorId, weekDates[4]);
  const d5 = useDayLessons(instructorId, weekDates[5]);
  const d6 = useDayLessons(instructorId, weekDates[6]);
  const weekDays = [d0, d1, d2, d3, d4, d5, d6];
  const weekLessonsTotal = weekDays.reduce((sum, q) => sum + (q.data?.length ?? 0), 0);
  const weekLoading = weekDays.some((q) => q.isLoading);

  const headerDate = format(now, "EEE d MMM").toUpperCase();
  const headerWeek = `WK ${getISOWeek(now)}`;

  const todayCount = overview?.lessonCount ?? todayLessons.length;
  const earnedToday = Math.round(overview?.expectedEarnings ?? 0);
  const earnedWeek = Math.round(weeklyGoals?.earningsThisWeek ?? 0);

  const handleLessonClick = (lesson: TodayLesson) => {
    navigate(`/instructor/pupils/${lesson.pupilId}`);
  };

  const renderLessonList = (items: TodayLesson[]) => (
    <div className="flex flex-col">
      {items.map((l) => (
        <LessonRow key={l.id} lesson={l} onClick={() => handleLessonClick(l)} />
      ))}
    </div>
  );

  const renderShimmerList = () => (
    <div className="flex flex-col" style={{ gap: 12, padding: "8px" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center" style={{ gap: 12 }}>
          <Shimmer width={48} height={28} />
          <div className="flex-1">
            <Shimmer width="60%" height={12} />
            <div style={{ marginTop: 6 }}>
              <Shimmer width="40%" height={10} />
            </div>
          </div>
          <Shimmer width={32} height={12} />
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: "0 16px", fontFamily: MANROPE }}>
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 20,
          boxShadow: "0 4px 16px rgba(15, 23, 36, 0.06), 0 1px 2px rgba(15, 23, 36, 0.04)",
          overflow: "hidden",
          border: `1px solid ${C.line}`,
        }}
      >
        {/* ── Gradient header ── */}
        <div
          style={{
            position: "relative",
            background: `linear-gradient(135deg, ${C.brand} 0%, ${C.brand2} 100%)`,
            padding: "14px 20px 12px",
            color: "#FFFFFF",
            overflow: "hidden",
          }}
        >
          {/* radial glow */}
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 180,
              height: 180,
              background:
                "radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 70%)",
              pointerEvents: "none",
            }}
          />
          {/* Top row */}
          <div
            className="flex items-center justify-between"
            style={{ position: "relative", zIndex: 1 }}
          >
            <div className="flex items-center" style={{ gap: 8 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: C.amber,
                  boxShadow: `0 0 0 0 ${C.amber}`,
                  animation: "homeSchedPulse 2s infinite",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>
                Today's schedule
              </span>
            </div>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11,
                color: "rgba(255,255,255,0.75)",
                letterSpacing: 0.3,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {headerDate} · {headerWeek}
            </span>
          </div>

          {/* Stats row */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 8,
              marginTop: 10,
              position: "relative",
              zIndex: 1,
            }}
          >
            {[
              {
                label: "TODAY",
                value: overviewLoading ? "—" : `${todayCount}`,
                suffix: todayCount === 1 ? "lesson" : "lessons",
              },
              {
                label: "EARNED",
                value: overviewLoading ? "—" : `£${earnedToday}`,
                suffix: null,
              },
              {
                label: "THIS WEEK",
                value: `£${earnedWeek}`,
                suffix: null,
              },
            ].map((s) => (
              <div key={s.label}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.7)",
                    letterSpacing: 0.6,
                    fontFamily: MANROPE,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    marginTop: 2,
                    display: "flex",
                    alignItems: "baseline",
                    gap: 4,
                    lineHeight: 1.1,
                  }}
                >
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#FFFFFF",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {s.value}
                  </span>
                  {s.suffix && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.7)",
                        fontFamily: MANROPE,
                      }}
                    >
                      {s.suffix}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div
          className="flex"
          role="tablist"
          style={{ borderBottom: `1px solid ${C.line}`, padding: "0 12px" }}
        >
          {([
            { id: "today", label: "Today", count: todayCount },
            { id: "tomorrow", label: "Tomorrow", count: tomorrowLessons.length },
            { id: "week", label: "Week", count: weekLessonsTotal },
          ] as const).map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(t.id)}
                className="flex items-center"
                style={{
                  gap: 6,
                  padding: "10px 12px",
                  borderBottom: `2px solid ${active ? C.brand2 : "transparent"}`,
                  marginBottom: -1,
                  fontSize: 13,
                  fontWeight: 600,
                  color: active ? C.brand : C.inkMute,
                  fontFamily: MANROPE,
                  transition: "all 150ms",
                }}
              >
                {t.label}
                <span
                  style={{
                    background: active ? C.badgeBlueBg : C.lineSoft,
                    color: active ? C.badgeBlueText : C.inkMute,
                    fontFamily: MONO,
                    fontSize: 10,
                    fontWeight: 500,
                    padding: "1px 7px",
                    borderRadius: 999,
                    minWidth: 18,
                    textAlign: "center",
                  }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Content area ── */}
        <div style={{ padding: 16 }}>
          {activeTab === "today" && (
            <>
              {todayLoading ? (
                renderShimmerList()
              ) : todayLessons.length === 0 ? (
                <>
                  {/* Empty hero */}
                  <div
                    style={{
                      position: "relative",
                      background: `linear-gradient(135deg, ${C.emptyHeroFrom} 0%, ${C.emptyHeroTo} 100%)`,
                      border: `1px solid ${C.line}`,
                      borderRadius: 14,
                      padding: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      overflow: "hidden",
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: -30,
                        right: -30,
                        width: 120,
                        height: 120,
                        background:
                          "radial-gradient(circle, rgba(59,95,212,0.12) 0%, rgba(59,95,212,0) 70%)",
                        pointerEvents: "none",
                      }}
                    />
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: "#FFFFFF",
                        boxShadow: "0 1px 3px rgba(15,23,36,0.06)",
                      }}
                    >
                      <Calendar size={22} strokeWidth={2} color={C.brand} />
                    </div>
                    <div className="flex-1 min-w-0" style={{ position: "relative", zIndex: 1 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: C.ink,
                          fontFamily: MANROPE,
                        }}
                      >
                        Your day is clear
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: C.inkSoft,
                          marginTop: 2,
                          fontFamily: MANROPE,
                          lineHeight: 1.35,
                        }}
                      >
                        No lessons scheduled. Next up tomorrow — here's a preview.
                      </div>
                    </div>
                  </div>

                  {/* Tomorrow preview */}
                  {tomorrowLoading ? (
                    renderShimmerList()
                  ) : tomorrowLessons.length > 0 ? (
                    <>
                      <DayHeaderStrip
                        label={`Tomorrow — ${format(tomorrowDate, "EEE d MMM")}`}
                        count={tomorrowLessons.length}
                        variant="preview"
                      />
                      {renderLessonList(tomorrowLessons)}
                    </>
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "12px 0",
                        fontSize: 12,
                        color: C.inkMute,
                      }}
                    >
                      Nothing scheduled for tomorrow either.
                    </div>
                  )}
                </>
              ) : (
                renderLessonList(todayLessons)
              )}
            </>
          )}

          {activeTab === "tomorrow" && (
            <>
              {tomorrowLoading ? (
                renderShimmerList()
              ) : tomorrowLessons.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px 0",
                    fontSize: 13,
                    color: C.inkMute,
                  }}
                >
                  Nothing scheduled for tomorrow.
                </div>
              ) : (
                renderLessonList(tomorrowLessons)
              )}
            </>
          )}

          {activeTab === "week" && (
            <>
              {weekLoading ? (
                renderShimmerList()
              ) : weekLessonsTotal === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px 0",
                    fontSize: 13,
                    color: C.inkMute,
                  }}
                >
                  No lessons this week.
                </div>
              ) : (
                <div className="flex flex-col" style={{ gap: 14 }}>
                  {weekDates.map((d, i) => {
                    const items = weekDays[i].data ?? [];
                    if (items.length === 0) return null;
                    return (
                      <div key={i}>
                        <DayHeaderStrip
                          label={format(d, "EEE d MMM")}
                          count={items.length}
                          variant="preview"
                        />
                        {renderLessonList(items)}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-between"
          style={{
            background: C.footerBg,
            borderTop: `1px solid ${C.line}`,
            padding: "12px 16px",
          }}
        >
          <button
            onClick={() => navigate("/instructor/schedule")}
            className="flex items-center transition-colors duration-150"
            style={{
              color: C.brand2,
              fontSize: 13,
              fontWeight: 600,
              gap: 4,
              fontFamily: MANROPE,
            }}
          >
            View full calendar
            <ArrowRight size={14} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setAddOpen(true)}
            aria-label="Add lesson"
            className="flex items-center transition-all duration-150"
            style={{
              background: C.ink,
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 12px 8px 8px",
              borderRadius: 10,
              gap: 8,
              fontFamily: MANROPE,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.brand;
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.ink;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span
              className="flex items-center justify-center"
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                background: "rgba(255,255,255,0.15)",
              }}
            >
              <Plus size={13} strokeWidth={2.5} color="#FFFFFF" />
            </span>
            Add lesson
          </button>
        </div>
      </div>

      {/* Pulsing dot keyframes */}
      <style>{`
        @keyframes homeSchedPulse {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6); }
          70% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
      `}</style>

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
            queryClient.invalidateQueries({ queryKey: ["day-lessons"] });
          }}
        />
      )}
    </div>
  );
}
