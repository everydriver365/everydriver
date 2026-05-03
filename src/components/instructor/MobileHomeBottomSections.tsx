import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, parse } from "date-fns";
import { Plus, Search, ChevronsLeftRight } from "lucide-react";

import { useDayLessons } from "@/hooks/useDayLessons";
import { useDayLessonHistory, eolKey } from "@/hooks/useDayLessonHistory";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { useInstructorPupilsPaymentSummary } from "@/hooks/usePupilPaymentStatus";
import { useInstructorPinnedTiles } from "@/hooks/useInstructorPinnedTiles";
import { QUICK_ACCESS_TILES, QUICK_ACCESS_TILES_BY_ID } from "@/components/instructor/quickAccess/tileRegistry";
import { AddLessonSheet } from "@/components/instructor/AddLessonSheet";
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
          fontSize: 10,
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
  const [selectedDay, setSelectedDay] = useState<"Today" | "Tomorrow">("Today");
  const [showAdd, setShowAdd] = useState(false);

  const dayDate = useMemo(() => {
    const d = new Date();
    if (selectedDay === "Tomorrow") d.setDate(d.getDate() + 1);
    return d;
  }, [selectedDay]);

  const { data: lessons = [], isLoading } = useDayLessons(instructorId, dayDate);
  const { data: eolSet } = useDayLessonHistory(instructorId, dayDate);

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
    <div style={{ padding: "0 20px", marginBottom: 18 }}>
      <SectionHeader
        label="Today's schedule"
        rightLabel="View all →"
        onRightPress={() => navigate("/instructor/schedule")}
      />

      {/* Day toggle — soft segmented control */}
      <div
        style={{
          background: "rgba(15,35,65,0.05)",
          borderRadius: 12,
          padding: 3,
          display: "flex",
          gap: 2,
          marginBottom: 10,
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
                padding: "7px 0",
                background: active ? "#FFFFFF" : "transparent",
                border: "none",
                cursor: "pointer",
                boxShadow: active
                  ? "0 1px 3px rgba(15,35,65,0.10), 0 0 0 0.5px rgba(15,35,65,0.06)"
                  : "none",
                transition: "background 150ms ease",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: active ? "#315FAE" : "#6B7A90",
                  letterSpacing: "-0.1px",
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
        className="home-v2-card"
        style={{
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
            const rowBg =
              e.status === "inProgress"
                ? "#F2FBF5"
                : e.status === "upcoming"
                  ? BLUE_TINT
                  : "#FFF";
            const bandColor =
              e.status === "inProgress"
                ? "#1A7A3C"
                : e.status === "upcoming"
                  ? BLUE
                  : e.status === "cancelled"
                    ? "#B23A3F"
                    : "#E0E5EE";
            const timeColor =
              e.status === "upcoming" ? BLUE : "#1A1A1A";
            const minutesUntil =
              e.status === "upcoming" && e.start
                ? Math.max(0, Math.round((e.start.getTime() - now.getTime()) / 60_000))
                : 0;
            const fee = e.lesson.amountDue ?? 0;

            return (
              <div key={e.lesson.id}>
                {/* Lesson row */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => e.lesson.pupilId && navigate(`/instructor/pupils/${e.lesson.pupilId}`)}
                  onKeyDown={(ev) => {
                    if ((ev.key === "Enter" || ev.key === " ") && e.lesson.pupilId) {
                      ev.preventDefault();
                      navigate(`/instructor/pupils/${e.lesson.pupilId}`);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 12px",
                    gap: 8,
                    background: rowBg,
                    opacity: e.status === "done" ? 0.55 : 1,
                    cursor: e.lesson.pupilId ? "pointer" : "default",
                  }}
                >
                  {/* Left colour band */}
                  <div
                    style={{
                      width: 3,
                      height: 32,
                      borderRadius: 2,
                      background: bandColor,
                      flexShrink: 0,
                    }}
                  />

                  {/* Time + duration */}
                  <div style={{ minWidth: 36 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: -0.3,
                        lineHeight: "17px",
                        color: timeColor,
                      }}
                    >
                      {fmtTime(e.lesson.startTime)}
                    </div>
                    <div style={{ fontSize: 9, color: MUTED, marginTop: 1 }}>
                      {durationHours(e.lesson.durationMinutes || 60)}h
                    </div>
                  </div>

                  {/* Pupil name + detail */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: TEXT,
                        lineHeight: "17px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {e.lesson.pupilName}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: MUTED,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {e.lesson.lessonType}
                      {e.lesson.pickupLocation ? ` · ${e.lesson.pickupLocation}` : ""}
                    </div>
                  </div>

                  {/* Right status / fee area */}
                  {e.status === "inProgress" && (
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
                  )}
                  {e.status === "upcoming" && (
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
                  )}
                  {e.status === "done" && (
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
                  )}
                  {e.status === "cancelled" && (
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
                  )}
                </div>

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

                {/* Separator (not after last) */}
                {i < enriched.length - 1 && (
                  <div style={{ height: 0.5, background: ROW_DIVIDER }} />
                )}
              </div>
            );
          })
        )}

        {/* Add lesson row */}
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          style={{
            width: "100%",
            padding: "9px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Plus size={12} color={BLUE} strokeWidth={2.2} />
          <span style={{ fontSize: 11, fontWeight: 600, color: BLUE }}>
            Add lesson
          </span>
        </button>
      </div>

      <AddLessonSheet
        open={showAdd}
        onOpenChange={setShowAdd}
        instructorId={instructorId}
        defaultDate={dayDate}
        onSuccess={() => setShowAdd(false)}
      />
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

  const tiles = useMemo(
    () => pinnedIds.map((id) => QUICK_ACCESS_TILES_BY_ID[id]).filter(Boolean),
    [pinnedIds],
  );

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

  return (
    <div style={{ padding: "0 20px", marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#6B7A90",
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
              fontSize: 11,
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
          {pages.length > 1 && (
            <div style={{ display: "flex", gap: 3 }}>
              {pages.map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 3,
                    borderRadius: 2,
                    width: i === currentPage ? 12 : 5,
                    background: i === currentPage ? BLUE : "#D0D5DD",
                    transition: "width 0.2s ease",
                  }}
                />
              ))}
            </div>
          )}
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
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 10,
          border: `0.5px solid ${BORDER_STRONG}`,
          cursor: "pointer",
        }}
      >
        <Search size={12} color={MUTED} />
        <span style={{ fontSize: 11, color: "#C7C7CC", flex: 1, textAlign: "left" }}>
          Search tools, pupils, lessons
        </span>
        <span
          style={{
            background: "#F2F4F8",
            borderRadius: 5,
            padding: "2px 6px",
            border: "0.5px solid #E0E5EE",
            fontSize: 9,
            fontWeight: 600,
            color: MUTED,
          }}
        >
          ⌘K
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


      {/* Swipeable paged grid */}
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
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gridAutoRows: "1fr",
                  gap: 7,
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
                        background: "#FFF",
                        borderRadius: 13,
                        padding: "10px 4px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        border: `0.5px solid ${BORDER}`,
                        cursor: "pointer",
                      }}
                    >
                      {badge > 0 && <BadgeDot count={badge} />}
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          background: tonePair.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon
                          size={15}
                          color={tonePair.fg}
                          strokeWidth={1.6}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          textAlign: "center",
                          color: TEXT,
                          lineHeight: 1.2,
                        }}
                      >
                        {tile.title}
                      </span>
                    </button>
                  );
                })}
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
            gap: 4,
            marginTop: 4,
          }}
        >
          <ChevronsLeftRight size={9} color="#C7C7CC" />
          <span style={{ fontSize: 9, color: "#C7C7CC", fontWeight: 500 }}>
            Swipe for more
          </span>
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
      <ScheduleSection instructorId={instructorId} />
      <QuickAccessSection instructorId={instructorId} />
    </>
  );
}
