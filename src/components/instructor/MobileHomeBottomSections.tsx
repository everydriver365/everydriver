import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, parse } from "date-fns";
import { Plus, Search, ChevronsLeftRight, ChevronRight } from "lucide-react";

import { useDayLessons } from "@/hooks/useDayLessons";
import { useDayLessonHistory, eolKey } from "@/hooks/useDayLessonHistory";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { useInstructorPupilsPaymentSummary } from "@/hooks/usePupilPaymentStatus";
import { useInstructorPinnedTiles } from "@/hooks/useInstructorPinnedTiles";
import { QUICK_ACCESS_TILES, QUICK_ACCESS_TILES_BY_ID } from "@/components/instructor/quickAccess/tileRegistry";
import { AddLessonSheet } from "@/components/instructor/AddLessonSheet";
import { EndLessonWizard } from "@/components/instructor/EndLessonWizard";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { TodayLesson } from "@/hooks/useTodayRemainingLessons";
import { CustomizeFrequentlyUsedSheet } from "@/components/instructor/quickAccess/CustomizeFrequentlyUsedSheet";
import { InstructorSearchOverlay } from "@/components/instructor/InstructorSearchOverlay";

const BLUE = "#3D55A1";
const BLUE_TINT = "#EDF2FE";
const TEXT = "#1A1A1A";
const MUTED = "#8E8E93";
const BORDER = "rgba(26,82,160,0.08)";
const BORDER_STRONG = "rgba(26,82,160,0.10)";
const ROW_DIVIDER = "#F0F3F8";

/* ────────────────────────────────────────────────────── */
/* Shared bits                                            */
/* ────────────────────────────────────────────────────── */

function SectionHeader({
  label,
  rightLabel,
  onRightPress,
}: {
  label: string;
  rightLabel?: string;
  onRightPress?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#000",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      {rightLabel && (
        <button
          type="button"
          onClick={onRightPress}
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: BLUE,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          {rightLabel}
        </button>
      )}
    </div>
  );
}

function BadgeDot({ count }: { count: number }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 5,
        right: 5,
        background: "#B23A3F",
        borderRadius: 8,
        minWidth: 13,
        height: 13,
        padding: "0 3px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
      }}
    >
      <span style={{ fontSize: 7, fontWeight: 700, color: "#FFF", lineHeight: 1 }}>
        {count > 99 ? "99+" : count}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────── */
/* Section 1 — Schedule                                   */
/* ────────────────────────────────────────────────────── */

function fmtTime(t: string | null | undefined) {
  if (!t) return "";
  try {
    return format(parse(t, "HH:mm:ss", new Date()), "HH:mm");
  } catch {
    return t.slice(0, 5);
  }
}
function durationHours(mins: number): string {
  const h = mins / 60;
  return Number.isInteger(h) ? `${h}` : h.toFixed(1);
}

type LessonStatus = "done" | "upcoming" | "inProgress" | "cancelled";

const STATUS_CFG: Record<LessonStatus, { bg: string; color: string }> = {
  done: { bg: "#F2F4F8", color: "#8E8E93" },
  upcoming: { bg: BLUE_TINT, color: BLUE },
  inProgress: { bg: "#E8F8ED", color: "#1A7A3C" },
  cancelled: { bg: "#FFF0F0", color: "#B23A3F" },
};

function StatusPill({ status, label }: { status: LessonStatus; label: string }) {
  const cfg = STATUS_CFG[status];
  return (
    <div
      style={{
        background: cfg.bg,
        borderRadius: 20,
        padding: "2px 7px",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: cfg.color,
          letterSpacing: 0.2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function ScheduleSection({ instructorId }: { instructorId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState<"Today" | "Tomorrow">("Today");
  const [showAdd, setShowAdd] = useState(false);
  const [wizardLesson, setWizardLesson] = useState<TodayLesson | null>(null);
  const [wizardBalance, setWizardBalance] = useState(0);

  const openEOLWizard = async (lesson: TodayLesson) => {
    let balance = 0;
    try {
      const { data } = await supabase
        .from("pupils")
        .select("account_balance")
        .eq("id", lesson.pupilId)
        .single();
      balance = Number(data?.account_balance ?? 0);
    } catch {
      balance = 0;
    }
    setWizardBalance(balance);
    setWizardLesson(lesson);
  };

  const dayDate = useMemo(() => {
    const d = new Date();
    if (selectedDay === "Tomorrow") d.setDate(d.getDate() + 1);
    return d;
  }, [selectedDay]);

  const { data: lessons = [], isLoading } = useDayLessons(instructorId, dayDate);
  const { data: eolSet } = useDayLessonHistory(instructorId, dayDate);
  const { data: gapDataForChip } = useRealGapSlots(instructorId);
  const openSlotsThisWeek = useMemo(() => {
    if (!gapDataForChip) return 0;
    const today = format(new Date(), "yyyy-MM-dd");
    const end = new Date();
    end.setDate(end.getDate() + (7 - end.getDay()));
    const endStr = format(end, "yyyy-MM-dd");
    return gapDataForChip
      .filter((g: any) => g.date >= today && g.date <= endStr)
      .reduce((sum: number, g: any) => sum + (g.slots?.length ?? 0), 0);
  }, [gapDataForChip]);

  // Tick every 30s so the NOW line and minutesUntil refresh.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30 * 1000);
    return () => clearInterval(id);
  }, []);
  void tick;

  const now = new Date();
  const isToday = selectedDay === "Today";
  const currentTimeString = format(now, "HH:mm");

  const enriched = useMemo(() => {
    return (lessons || []).map((l) => {
      const start = l.startTime
        ? new Date(`${format(dayDate, "yyyy-MM-dd")}T${l.startTime}`)
        : null;
      const end = start
        ? new Date(start.getTime() + (l.durationMinutes || 60) * 60_000)
        : null;
      const completed = eolSet?.has(eolKey(l.pupilId, l.startTime || "")) ?? false;

      let status: LessonStatus;
      let label: string;
      if (l.status === "cancelled") {
        status = "cancelled";
        label = "Cancelled";
      } else if (completed) {
        status = "done";
        label = "Done";
      } else if (isToday && start && end && now >= start && now <= end) {
        status = "inProgress";
        label = "Now";
      } else if (isToday && start && start < now) {
        // past but not EOL yet — treat as done (greyed)
        status = "done";
        label = "Done";
      } else if (start) {
        status = "upcoming";
        const mins = Math.max(0, Math.round((start.getTime() - now.getTime()) / 60_000));
        if (!isToday) {
          label = fmtTime(l.startTime);
        } else if (mins < 60) {
          label = `${mins}m`;
        } else {
          const h = Math.round(mins / 60);
          label = `${h}h`;
        }
      } else {
        status = "upcoming";
        label = "Soon";
      }

      return { lesson: l, start, end, status, label };
    });
  }, [lessons, eolSet, dayDate, isToday, now]);

  // Position for NOW line: index *after* which to insert
  const nowLineIndex = useMemo(() => {
    if (!isToday || enriched.length === 0) return -1;
    let lastPast = -1;
    for (let i = 0; i < enriched.length; i++) {
      const e = enriched[i];
      if (e.start && e.start <= now) lastPast = i;
    }
    if (lastPast < 0 || lastPast >= enriched.length - 1) return -1;
    // Don't show NOW if the next lesson is currently in progress
    if (enriched[lastPast + 1]?.status === "inProgress") return -1;
    return lastPast;
  }, [enriched, isToday, now]);

  return (
    <div style={{ padding: "0 14px", marginBottom: 14 }}>
      <SectionHeader
        label="Schedule"
        rightLabel="View all →"
        onRightPress={() => navigate("/instructor/schedule")}
      />

      {/* Day toggle */}
      <div
        style={{
          background: "#FFF",
          borderRadius: 12,
          padding: 3,
          display: "flex",
          gap: 2,
          marginBottom: 8,
          border: `0.5px solid ${BORDER_STRONG}`,
        }}
      >
        {(["Today", "Tomorrow"] as const).map((day) => {
          const active = selectedDay === day;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              style={{
                flex: 1,
                borderRadius: 9,
                padding: "5px 0",
                background: active ? BLUE : "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: active ? "#FFF" : MUTED,
                }}
              >
                {day}
              </span>
            </button>
          );
        })}
      </div>

      {/* Card */}
      <div
        style={{
          background: "#FFF",
          borderRadius: 16,
          border: `0.5px solid ${BORDER}`,
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <div style={{ padding: 20, textAlign: "center" }}>
            <div
              style={{
                height: 38,
                background: "#F4F6FA",
                borderRadius: 8,
                animation: "pulse 1.4s ease-in-out infinite",
              }}
            />
          </div>
        ) : enriched.length === 0 ? (
          <div
            style={{
              padding: "18px 14px",
              textAlign: "center",
              color: MUTED,
              fontSize: 12,
            }}
          >
            No lessons {selectedDay.toLowerCase()}
          </div>
        ) : (
          enriched.map((e, i) => {
            const accentColor =
              e.status === "inProgress"
                ? "#1A7A3C"
                : e.status === "upcoming"
                  ? BLUE
                  : e.status === "cancelled"
                    ? "#B23A3F"
                    : "#C7C7CC";
            const rowBg =
              e.status === "inProgress"
                ? "#F2FBF5"
                : e.status === "upcoming" && isToday
                  ? BLUE_TINT
                  : "transparent";
            const minutesUntil =
              e.status === "upcoming" && e.start
                ? Math.max(0, Math.round((e.start.getTime() - now.getTime()) / 60_000))
                : 0;
            const fee = e.lesson.amountDue ?? 0;
            const eolDone = e.lesson.pupilId
              ? (eolSet?.has(eolKey(e.lesson.pupilId, e.lesson.startTime || "")) ?? false)
              : false;
            const isPaid = e.lesson.paymentStatus === "paid";
            const showPayPill = fee > 0;
            const subtitleParts: string[] = [];
            if (e.lesson.lessonType) {
              subtitleParts.push(String(e.lesson.lessonType).replace(/_/g, " "));
            }
            if (e.lesson.pickupLocation) {
              subtitleParts.push(e.lesson.pickupLocation);
            }
            const subtitle = subtitleParts.join(" · ");

            return (
              <div key={e.lesson.id}>
                <button
                  type="button"
                  onClick={() => e.lesson.pupilId && navigate(`/instructor/pupils/${e.lesson.pupilId}`)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    background: rowBg,
                    border: "none",
                    borderTop: i === 0 ? "none" : `0.5px solid ${ROW_DIVIDER}`,
                    textAlign: "left",
                    cursor: e.lesson.pupilId ? "pointer" : "default",
                    opacity: e.status === "done" ? 0.55 : 1,
                  }}
                >
                  {/* Time label */}
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
                    {fmtTime(e.lesson.startTime)}
                  </div>

                  {/* Accent bar */}
                  <span
                    style={{
                      width: 3,
                      alignSelf: "stretch",
                      borderRadius: 2,
                      background: accentColor,
                      flexShrink: 0,
                    }}
                  />

                  {/* Title + subtitle + chips */}
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
                      {e.lesson.pupilName}
                    </div>
                    {subtitle && (
                      <div
                        style={{
                          fontSize: 10,
                          color: MUTED,
                          marginTop: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          textTransform: "capitalize",
                        }}
                      >
                        {subtitle}
                      </div>
                    )}
                    {(showPayPill || e.lesson.pupilId) && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 4,
                        }}
                      >
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            openEOLWizard(e.lesson);
                          }}
                          style={{
                            background: BLUE_TINT,
                            borderRadius: 20,
                            padding: "2px 7px",
                            border: "none",
                            cursor: "pointer",
                            lineHeight: 1.2,
                          }}
                          aria-label={eolDone ? "End of lesson complete — review" : "Complete end of lesson"}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: BLUE,
                              letterSpacing: 0.2,
                              textTransform: "uppercase",
                              textDecoration: eolDone ? "line-through" : "none",
                              opacity: eolDone ? 0.6 : 1,
                            }}
                          >
                            EOL
                          </span>
                        </button>
                        {showPayPill && (
                          <div
                            style={{
                              background: isPaid ? "#E8F8ED" : "#FFECEC",
                              borderRadius: 20,
                              padding: "2px 7px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                            aria-label={isPaid ? "Paid" : "Not paid"}
                          >
                            <div
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: 3,
                                background: isPaid ? "#1A7A3C" : "#D33B3B",
                              }}
                            />
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: isPaid ? "#1A7A3C" : "#D33B3B",
                                letterSpacing: 0.2,
                                textTransform: "uppercase",
                              }}
                            >
                              {isPaid ? "Paid" : "Not paid"}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right status / fee */}
                  {e.status === "inProgress" ? (
                    <div
                      style={{
                        background: "#E8F8ED",
                        borderRadius: 20,
                        padding: "2px 7px",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <div style={{ width: 5, height: 5, borderRadius: 3, background: "#1A7A3C" }} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#1A7A3C" }}>Now</span>
                    </div>
                  ) : e.status === "upcoming" && isToday ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: BLUE }}>
                        {minutesUntil}m
                      </span>
                      {fee > 0 && (
                        <span style={{ fontSize: 9, fontWeight: 600, color: "#1A7A3C", marginTop: 1 }}>
                          £{fee}
                        </span>
                      )}
                    </div>
                  ) : e.status === "done" ? (
                    <div
                      style={{
                        background: "#F2F4F8",
                        borderRadius: 20,
                        padding: "2px 7px",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 9, fontWeight: 600, color: "#8E8E93" }}>Done</span>
                    </div>
                  ) : e.status === "cancelled" ? (
                    <div
                      style={{
                        background: "#FFF0F0",
                        borderRadius: 20,
                        padding: "2px 7px",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#B23A3F" }}>Cancelled</span>
                    </div>
                  ) : null}
                  <ChevronRight size={12} color="#C7C7CC" strokeWidth={1.8} style={{ flexShrink: 0, marginLeft: 2 }} />
                </button>

                {/* NOW line between past and future */}
                {nowLineIndex === i && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "0 12px",
                    }}
                  >
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        background: "#B23A3F",
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        height: 0.5,
                        background: "rgba(204,34,41,0.3)",
                      }}
                    />
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: "#B23A3F",
                        flexShrink: 0,
                      }}
                    >
                      {currentTimeString}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* V6 Command-style chip pair: Add lesson + Fill gaps */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "10px 12px 6px",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#FFFFFF",
              border: `0.5px solid ${BORDER}`,
              padding: "7px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              color: TEXT,
              cursor: "pointer",
            }}
          >
            <Plus size={13} color={BLUE} strokeWidth={2.2} />
            Add lesson
          </button>
          <button
            type="button"
            onClick={() => navigate("/instructor/gaps")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#FFFFFF",
              border: `0.5px solid ${BORDER}`,
              padding: "7px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              color: TEXT,
              cursor: "pointer",
            }}
          >
            <ChevronsLeftRight size={13} color={BLUE} strokeWidth={2.2} />
            Fill gaps
            {openSlotsThisWeek > 0 && (
              <span
                style={{
                  background: BLUE_TINT,
                  color: BLUE,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 999,
                  marginLeft: 2,
                }}
              >
                {openSlotsThisWeek}
              </span>
            )}
          </button>
        </div>
      </div>

      <AddLessonSheet
        open={showAdd}
        onOpenChange={setShowAdd}
        instructorId={instructorId}
        defaultDate={dayDate}
        onSuccess={() => setShowAdd(false)}
      />

      {wizardLesson && (
        <EndLessonWizard
          open={!!wizardLesson}
          onOpenChange={(open) => {
            if (!open) setWizardLesson(null);
          }}
          lessonId={wizardLesson.id}
          pupilId={wizardLesson.pupilId}
          pupilName={wizardLesson.pupilName}
          instructorId={instructorId}
          durationMinutes={wizardLesson.durationMinutes}
          lessonDate={format(dayDate, "yyyy-MM-dd")}
          startTime={wizardLesson.startTime}
          currentBalance={wizardBalance}
          onCompleted={() => {
            setWizardLesson(null);
            queryClient.invalidateQueries({ queryKey: ["day-lessons"] });
            queryClient.invalidateQueries({ queryKey: ["day-lesson-history"] });
            queryClient.invalidateQueries({ queryKey: ["today-overview"] });
            queryClient.invalidateQueries({ queryKey: ["today-remaining-lessons"] });
          }}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────── */
/* Section 2 — Quick Access (merged Quick Actions + Tools)*/
/* ────────────────────────────────────────────────────── */

const TONE_PALETTE: Record<string, { bg: string; fg: string }> = {
  blue: { bg: BLUE_TINT, fg: BLUE },
  green: { bg: "#E8F8ED", fg: "#1A7A3C" },
  amber: { bg: "#FFF6E6", fg: "#B45309" },
  purple: { bg: "#F0EEFF", fg: "#5B47C9" },
  red: { bg: "#FFF0F0", fg: "#B23A3F" },
  grey: { bg: "#F2F4F8", fg: "#5B6B8A" },
};

function QuickAccessSection({ instructorId }: { instructorId: string }) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { pinnedIds, setPins, isSaving } = useInstructorPinnedTiles(instructorId);

  const { data: unread = 0 } = useUnreadMessagesCount(instructorId);
  const pendingJobs = usePendingJobsCount();
  const { data: gapData } = useRealGapSlots(instructorId);
  const { data: paymentsSummary } = useInstructorPupilsPaymentSummary(instructorId);

  const openGapCount = (gapData ?? []).reduce(
    (sum, g) => sum + (g.slots?.length ?? 0),
    0,
  );
  const debtors = paymentsSummary?.debtors ?? 0;

  const badgeFor = (tileId: string): number => {
    switch (tileId) {
      case "messages": return unread;
      case "tests": return pendingJobs;
      case "fill-gaps": return openGapCount;
      case "take-payment": return debtors;
      default: return 0;
    }
  };

  const tiles = useMemo(() => {
    const pinned = pinnedIds
      .map((id) => QUICK_ACCESS_TILES_BY_ID[id])
      .filter(Boolean);
    const pinnedSet = new Set(pinned.map((t) => t.id));
    const rest = QUICK_ACCESS_TILES.filter((t) => !pinnedSet.has(t.id));
    return [...pinned, ...rest];
  }, [pinnedIds]);

  const PER_PAGE = 8;
  const pages: typeof tiles[] = useMemo(() => {
    if (tiles.length === 0) return [];
    const out: typeof tiles[] = [];
    for (let i = 0; i < tiles.length; i += PER_PAGE) {
      out.push(tiles.slice(i, i + PER_PAGE));
    }
    return out;
  }, [tiles]);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const page = Math.round(el.scrollLeft / el.clientWidth);
    if (page !== currentPage) setCurrentPage(page);
  };

  const subtitleFor = (tileId: string): string | undefined => {
    switch (tileId) {
      case "messages": return unread > 0 ? `${unread} unread` : undefined;
      case "tests": return pendingJobs > 0 ? `${pendingJobs} pending` : undefined;
      case "fill-gaps": return openGapCount > 0 ? `${openGapCount} open slot${openGapCount === 1 ? "" : "s"}` : undefined;
      case "take-payment": return debtors > 0 ? `${debtors} owing` : undefined;
      default: return undefined;
    }
  };

  const renderDots = (size: "header" | "bottom") => {
    const activeW = size === "header" ? 16 : 18;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: size === "header" ? 4 : 5 }}>
        {pages.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === currentPage ? activeW : 4,
              height: 4,
              borderRadius: 2,
              background: i === currentPage ? BLUE : "#D0D5DD",
              transition: "width 0.2s ease",
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: "0 14px", marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: MUTED,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Quick access
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: BLUE,
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            Edit
          </button>
          {pages.length > 1 && renderDots("header")}
        </div>
      </div>

      {/* Search bar */}
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        style={{
          width: "100%",
          background: "#FFF",
          borderRadius: 12,
          padding: "9px 12px",
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 12,
          border: `0.5px solid ${BORDER_STRONG}`,
          cursor: "pointer",
        }}
      >
        <Search size={13} color={MUTED} strokeWidth={1.8} />
        <span style={{ fontSize: 11.5, color: "#C7C7CC", flex: 1, textAlign: "left" }}>
          Search tools, pupils, lessons...
        </span>
      </button>

      <CustomizeFrequentlyUsedSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        initialPinnedIds={pinnedIds}
        onSave={async (ids) => {
          await setPins(ids);
          setEditOpen(false);
        }}
        saving={isSaving}
      />

      <InstructorSearchOverlay
        open={searchOpen}
        onOpenChange={setSearchOpen}
        instructorId={instructorId}
      />


      {/* Swipeable paged grid (2x2) */}
      {pages.length === 0 ? (
        <div
          style={{
            padding: "16px 12px",
            textAlign: "center",
            color: MUTED,
            fontSize: 12,
            background: "#FFF",
            borderRadius: 13,
            border: `0.5px solid ${BORDER}`,
          }}
        >
          No tools pinned yet
        </div>
      ) : (
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          style={{
            display: "flex",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            margin: "0 -2px",
          }}
          className="quick-access-scroller"
        >
          {pages.map((pageTiles, pageIdx) => (
            <div
              key={pageIdx}
              style={{
                flex: "0 0 100%",
                scrollSnapAlign: "start",
                padding: "0 2px",
              }}
            >
              <div
                style={{
                  background: "#FFF",
                  borderRadius: 16,
                  border: `0.5px solid ${BORDER}`,
                  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                  padding: "14px 12px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    rowGap: 14,
                    columnGap: 6,
                  }}
                >
                  {pageTiles.map((tile) => {
                    const Icon = tile.icon;
                    const tonePair = TONE_PALETTE[tile.tone] ?? TONE_PALETTE.blue;
                    const badge = badgeFor(tile.id);
                    return (
                      <button
                        key={tile.id}
                        type="button"
                        onClick={() => navigate(tile.route)}
                        style={{
                          position: "relative",
                          background: "transparent",
                          border: 0,
                          padding: 0,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 6,
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            position: "relative",
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: tonePair.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon size={20} color={tonePair.fg} strokeWidth={1.9} />
                          {badge > 0 && <BadgeDot count={badge} />}
                        </div>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            lineHeight: 1.2,
                            color: TEXT,
                            textAlign: "center",
                            maxWidth: 68,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {tile.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages.length > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 10,
          }}
        >
          {renderDots("bottom")}
        </div>
      )}

      <style>{`
        .quick-access-scroller::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

/* ────────────────────────────────────────────────────── */
/* Public bundle                                          */
/* ────────────────────────────────────────────────────── */

export function MobileHomeBottomSections({
  instructorId,
}: {
  instructorId: string;
}) {
  return (
    <>
      <QuickAccessSection instructorId={instructorId} />
    </>
  );
}
