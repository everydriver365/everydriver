import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, parse, addDays } from "date-fns";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useDayLessons } from "@/hooks/useDayLessons";
import { useDayLessonHistory, eolKey } from "@/hooks/useDayLessonHistory";
import { AddLessonSheet } from "@/components/instructor/AddLessonSheet";
import { EndLessonWizard } from "@/components/instructor/EndLessonWizard";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { a11yPx } from "@/lib/a11yScale";
import type { TodayLesson } from "@/hooks/useTodayRemainingLessons";

interface HomeTodayScheduleProps {
  instructorId: string | undefined;
}

const IOS = {
  label: "#000000",
  secondaryLabel: "#6E6E73",
  tertiaryLabel: "rgba(60,60,67,.30)",
  opaqueSeparator: "#E5E5EA",
  fill: "#F2F2F4",
  systemBlue: "#3D55A1",
  systemGreen: "#3B8B3B",
  systemRed: "#C8434F",
  systemAmber: "#B8801F",
  card: "#FFFFFF",
  blueTint: "#EDF2FE",
  greenTint: "#E8F3E8",
  amberTint: "#FBF1DE",
  redTint: "#FBEAEC",
  doneBar: "#C7C7CC",
  statBg: "#F8FAFB",
};

const IOS_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', sans-serif";

function fmtTime(time: string) {
  try {
    const d = parse(time, "HH:mm:ss", new Date());
    return format(d, "HH:mm");
  } catch {
    return time.slice(0, 5);
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

function startSeconds(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 3600 + (m || 0) * 60;
}

type LessonState = "completed" | "live" | "upcoming";

function getLessonState(lesson: TodayLesson, nowSec: number, isTomorrow: boolean): LessonState {
  if (isTomorrow) return "upcoming";
  if (lesson.status === "completed") return "completed";
  const startSec = startSeconds(lesson.startTime);
  const endSec = startSec + (lesson.durationMinutes || 0) * 60;
  if (nowSec >= endSec) return "completed";
  if (nowSec >= startSec) return "live";
  return "upcoming";
}

// EOL completeness is sourced from the lesson_history table via
// useDayLessonHistory; helpers below take a Set<string> of completed keys.
function isEOLComplete(lesson: TodayLesson, doneKeys: Set<string>): boolean {
  return doneKeys.has(eolKey(lesson.pupilId, lesson.startTime));
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

// ----- Inline icon primitives -----
function CalendarIcon({ size = 12, color = IOS.systemBlue, strokeWidth = 2 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

function PoundIcon({ size = 12, color = IOS.systemGreen, strokeWidth = 2 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 6.5a4 4 0 0 0-7.5 1.9V13H6M6 13h8M16 19H6c1.5-1 2.5-2.5 2.5-5" />
    </svg>
  );
}

function AlertIcon({ size = 12, color = IOS.systemAmber }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 16v.5" />
    </svg>
  );
}

function TriangleAlertIcon({ size = 16, color = IOS.systemRed }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17v.5" />
    </svg>
  );
}

function MapPinIcon({ size = 12, color = IOS.secondaryLabel }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ChevronRight({ color = IOS.secondaryLabel, size = 12 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function CheckTickIcon({ size = 14, color = IOS.systemGreen }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/**
 * Compact, subtle right-side status icons for a lesson row.
 *  - Shows a small green ✓ for completed EOL
 *  - Shows a small £ for completed payment
 *  - Shows a small amber dot when a past lesson is missing EOL or payment
 * Reserves consistent right-side width so it never clashes with the chevron.
 */
function RowStatusIcons({
  eolDone,
  paymentDone,
  needsAttention,
}: {
  eolDone?: boolean;
  paymentDone?: boolean;
  needsAttention?: boolean;
}) {
  if (!eolDone && !paymentDone && !needsAttention) return null;
  return (
    <div
      aria-label={[
        eolDone ? "End-of-lesson complete" : null,
        paymentDone ? "Payment recorded" : null,
        needsAttention ? "Needs attention" : null,
      ].filter(Boolean).join(", ")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
        minWidth: 20,
      }}
    >
      {eolDone && <CheckTickIcon size={14} color={IOS.systemGreen} />}
      {paymentDone && <PoundIcon size={14} color={IOS.secondaryLabel} strokeWidth={2.2} />}
      {needsAttention && (
        <span
          title="Needs attention"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: IOS.systemAmber,
            display: "inline-block",
          }}
        />
      )}
    </div>
  );
}

// ----- Pills -----
type PillKind = "done" | "live" | "conflict" | "review";

function StatusPill({ kind, dimmed = false }: { kind: PillKind; dimmed?: boolean }) {
  const map: Record<PillKind, { bg: string; fg: string; label: string }> = {
    done: { bg: IOS.greenTint, fg: IOS.systemGreen, label: "Done" },
    live: { bg: IOS.redTint, fg: IOS.systemRed, label: "Live" },
    conflict: { bg: IOS.amberTint, fg: IOS.systemAmber, label: "Conflict" },
    review: { bg: IOS.amberTint, fg: IOS.systemAmber, label: "Review" },
  };
  const { bg, fg, label } = map[kind];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: bg,
        color: fg,
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: 0.3,
        padding: "2px 5px",
        borderRadius: 3,
        textTransform: "uppercase",
        opacity: dimmed ? 0.55 : 1,
        flexShrink: 0,
      }}
    >
      {kind === "live" && (
        <span
          className="hts-live-dot"
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: IOS.systemRed,
          }}
        />
      )}
      {label}
    </span>
  );
}

// Heuristic for the existing "Review" flag — corrupted pupil names.
// Kept conservative: only triggers on clearly-bad strings, defaults false.
function needsNameReview(name: string): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (/^(unknown|n\/a|none|test|tbc|tba)$/i.test(trimmed)) return true;
  if (/[<>{}\\@#$%^*]/.test(trimmed)) return true;
  const first = trimmed.split(/\s+/)[0];
  if (!first) return false;
  if (/(.)\1{1,}/i.test(first) && first.length <= 5) return true;
  if (first.length >= 3 && !/[aeiouy]/i.test(first)) return true;
  return false;
}

// ----- Compact stat tile -----
interface CompactStatTileProps {
  icon: React.ReactNode;
  iconBackground: string;
  hero: React.ReactNode;
  label: string;
}

function CompactStatTile({ icon, iconBackground, hero, label }: CompactStatTileProps) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: IOS.statBg,
        border: `0.5px solid ${IOS.opaqueSeparator}`,
        borderRadius: 8,
        padding: "8px 10px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: iconBackground,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: IOS.label,
            letterSpacing: -0.2,
            lineHeight: 1.1,
            margin: 0,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {hero}
        </div>
        <div style={{ fontSize: 10, color: IOS.secondaryLabel, margin: "1px 0 0" }}>{label}</div>
      </div>
    </div>
  );
}

// ----- EOL prompt -----
// Always rendered on completed lessons. When the EOL flow has finished, the
// marker stays in place but is muted with strikethrough so the row's history
// is still discoverable (re-tap reopens the wizard for review/edit).
function EOLPrompt({ onTap, done = false }: { onTap: () => void; done?: boolean }) {
  const fg = done ? IOS.secondaryLabel : IOS.systemAmber;
  const bg = done ? "rgba(120,120,128,0.12)" : IOS.amberTint;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onTap();
      }}
      style={{
        background: bg,
        borderRadius: 6,
        padding: "6px 10px",
        marginTop: 8,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        border: "none",
        opacity: 1,
        fontFamily: IOS_FONT,
      }}
    >
      <AlertIcon size={12} color={fg} />
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: fg,
          textDecoration: done ? "line-through" : "none",
        }}
      >
        Complete EOL
      </span>
    </button>
  );
}

// ----- Conflict banner -----
function ConflictBanner({ time }: { time: string }) {
  return (
    <div
      style={{
        background: IOS.redTint,
        borderRadius: 10,
        padding: "10px 12px",
        margin: "0 0 8px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <TriangleAlertIcon size={16} color={IOS.systemRed} />
      <p
        style={{
          fontSize: 11,
          color: IOS.systemRed,
          fontWeight: 500,
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        Two lessons booked at {time} — review and resolve
      </p>
    </div>
  );
}

export function HomeTodaySchedule({ instructorId }: HomeTodayScheduleProps) {
  const [tab, setTab] = useState<"today" | "tomorrow">("today");
  const [addOpen, setAddOpen] = useState(false);
  const [wizardLesson, setWizardLesson] = useState<TodayLesson | null>(null);
  const [wizardBalance, setWizardBalance] = useState<number>(0);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Re-tick every 30s so live/completed transitions render in real time.
  const [tickNow, setTickNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setTickNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const targetDate = tab === "today" ? tickNow : addDays(tickNow, 1);
  const isTomorrow = tab === "tomorrow";

  const { data: overview, isLoading: overviewLoading } = useTodayOverview(instructorId);
  const { data: lessons = [], isLoading: lessonsLoading } = useDayLessons(instructorId, targetDate);
  const { data: eolDoneKeys = new Set<string>() } = useDayLessonHistory(instructorId, targetDate);

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

  const nowSec = tickNow.getHours() * 3600 + tickNow.getMinutes() * 60;

  // ---- Stats ----
  const dayLessonCount = lessons.length;
  const dayTotalHours = lessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0) / 60;
  const dayAmountDueSum = lessons.reduce((sum, l) => sum + (l.amountDue ?? 0), 0);
  const dayHasAnyAmount = lessons.some((l) => l.amountDue != null && l.amountDue > 0);

  const lessonCount = isTomorrow ? dayLessonCount : (overview?.lessonCount ?? dayLessonCount);
  const totalHours = isTomorrow ? dayTotalHours : (overview?.totalHours ?? dayTotalHours);

  const derivedHourlyRate =
    overview && overview.totalHours > 0 ? overview.expectedEarnings / overview.totalHours : 35;
  const earnings = dayHasAnyAmount
    ? Math.round(dayAmountDueSum)
    : isTomorrow
    ? Math.round(dayTotalHours * derivedHourlyRate)
    : Math.round(overview?.expectedEarnings ?? 0);

  const doneCount = useMemo(
    () => lessons.filter((l) => getLessonState(l, nowSec, isTomorrow) === "completed").length,
    [lessons, nowSec, isTomorrow],
  );

  // ---- Conflicts ----
  const { conflictIdSet, firstConflictRowId } = useMemo(() => {
    const intervals = lessons.map((l) => {
      const s = startSeconds(l.startTime);
      return { id: l.id, start: s, end: s + (l.durationMinutes || 0) * 60 };
    });
    const conflicts = new Set<string>();
    for (let i = 0; i < intervals.length; i++) {
      for (let j = i + 1; j < intervals.length; j++) {
        const a = intervals[i];
        const b = intervals[j];
        if (a.start < b.end && b.start < a.end) {
          conflicts.add(a.id);
          conflicts.add(b.id);
        }
      }
    }
    let first: string | null = null;
    for (const l of lessons) {
      if (conflicts.has(l.id)) {
        first = l.id;
        break;
      }
    }
    return { conflictIdSet: conflicts, firstConflictRowId: first };
  }, [lessons]);

  const firstConflictTime = useMemo(() => {
    if (!firstConflictRowId) return "";
    const row = lessons.find((l) => l.id === firstConflictRowId);
    return row ? fmtTime(row.startTime) : "";
  }, [firstConflictRowId, lessons]);

  // ---- Header strings ----
  const dayName = format(targetDate, "EEEE");
  const dateLabel = format(targetDate, "d MMMM");
  const isLoading = (tab === "today" && overviewLoading) || lessonsLoading;
  const hasLessons = lessons.length > 0;

  const subtitle = isLoading
    ? ""
    : hasLessons
    ? `${dateLabel} · ${doneCount} of ${dayLessonCount} done`
    : `${dateLabel} · no lessons ${isTomorrow ? "tomorrow" : "today"}`;

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
        @keyframes hts-live-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .hts-live-dot { animation: hts-live-pulse 1.4s ease-in-out infinite; }
        .hts-row:active, .hts-link:active, .hts-add:active { opacity: 0.8; }
        .hts-add:active { transform: scale(0.98); }
        @media (prefers-reduced-motion: reduce) {
          .hts-live-dot { animation: none !important; }
        }
      `}</style>

      <div
        style={{
          maxWidth: 440,
          margin: "0 auto",
          background: IOS.card,
          border: `0.5px solid ${IOS.opaqueSeparator}`,
          borderRadius: 12,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          color: IOS.label,
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: IOS.systemBlue,
                letterSpacing: 0.3,
                textTransform: "uppercase",
                margin: "0 0 4px",
              }}
            >
              Schedule
            </span>
            <span
              style={{
                fontSize: a11yPx(22),
                fontWeight: 500,
                letterSpacing: -0.4,
                lineHeight: 1.15,
                color: IOS.label,
                margin: "0 0 2px",
              }}
            >
              {dayName}
            </span>
            <span style={{ fontSize: 12, color: IOS.secondaryLabel, margin: 0 }}>
              {isLoading ? <SkeletonBlock width={160} height={12} /> : subtitle}
            </span>
          </div>
        </div>

        {/* SEGMENTED CONTROL */}
        <div
          style={{
            padding: 3,
            background: IOS.fill,
            borderRadius: 8,
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 4,
            marginBottom: 12,
          }}
        >
          {(["today", "tomorrow"] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: active ? 500 : 400,
                  color: active ? IOS.label : IOS.secondaryLabel,
                  background: active ? "#FFFFFF" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s cubic-bezier(0.2,0.7,0.2,1)",
                  fontFamily: IOS_FONT,
                }}
              >
                {t === "today" ? "Today" : "Tomorrow"}
              </button>
            );
          })}
        </div>

        {/* COMPACT STAT TILES */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <CompactStatTile
            icon={<CalendarIcon size={12} color={IOS.systemBlue} strokeWidth={2} />}
            iconBackground={IOS.blueTint}
            hero={
              isLoading ? (
                <SkeletonBlock width={36} height={12} />
              ) : (
                <>
                  {lessonCount}
                  <span style={{ fontSize: 10, fontWeight: 400, color: IOS.secondaryLabel, marginLeft: 4 }}>
                    · {totalHoursLabel(totalHours)}
                  </span>
                </>
              )
            }
            label="Lessons"
          />
          <CompactStatTile
            icon={<PoundIcon size={12} color={IOS.systemGreen} strokeWidth={2} />}
            iconBackground={IOS.greenTint}
            hero={isLoading ? <SkeletonBlock width={36} height={12} /> : `£${earnings.toLocaleString("en-GB")}`}
            label="Earned"
          />
        </div>

        {/* BODY */}
        {isLoading ? (
          <div style={{ borderTop: `0.5px solid ${IOS.opaqueSeparator}`, paddingTop: 12 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0" }}>
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
              padding: "24px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: IOS.fill,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CalendarIcon size={20} color={IOS.secondaryLabel} strokeWidth={2} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: IOS.label }}>
              {isTomorrow ? "No lessons tomorrow" : "No lessons today"}
            </div>
            <div style={{ fontSize: 12, color: IOS.secondaryLabel }}>
              {isTomorrow ? "Plan ahead or add a lesson" : "Perfect time to catch up on admin"}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lessons.map((lesson) => {
              const state = getLessonState(lesson, nowSec, isTomorrow);
              const isDrivingTest = (lesson.lessonType || "").toLowerCase().includes("driving test")
                || (lesson.lessonType || "").toLowerCase().includes("driving_test");
              const lessonLabel = isDrivingTest ? "Driving test" : `${lesson.lessonType || "Standard"} lesson`;
              const location = lesson.pickupLocation || lesson.pickupPostcode || null;
              const subtitleText = [lessonLabel, location].filter(Boolean).join(" · ");
              const time = fmtTime(lesson.startTime);
              const startSec = startSeconds(lesson.startTime);
              const endSec = startSec + (lesson.durationMinutes || 0) * 60;
              const minutesRemaining = Math.max(0, Math.ceil((endSec - nowSec) / 60));
              const showReview = needsNameReview(lesson.pupilName);
              const isConflict = conflictIdSet.has(lesson.id);
              const showBannerAbove = lesson.id === firstConflictRowId;
              const showEOL = state === "completed" && lesson.status !== "cancelled";
              const eolDone = showEOL && isEOLComplete(lesson, eolDoneKeys);
              const lessonHref = `/instructor/pupils/${lesson.pupilId}`;
              const isPaid = lesson.paymentStatus === "paid" || lesson.paymentStatus === "cash";
              const dimmed = state === "completed";
              const accentColor =
                state === "live" ? IOS.systemRed
                : state === "completed" ? IOS.doneBar
                : isDrivingTest ? IOS.systemAmber
                : IOS.systemBlue;

              const card = (
                <Link
                  to={lessonHref}
                  className="hts-row"
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    background: IOS.card,
                    borderRadius: 16,
                    padding: "12px 14px",
                    border: "0.5px solid rgba(26,82,160,0.08)",
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    textDecoration: "none",
                    color: "inherit",
                    WebkitTapHighlightColor: "transparent",
                    opacity: dimmed ? 0.75 : 1,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 10,
                      bottom: 10,
                      width: 3,
                      borderRadius: "0 2px 2px 0",
                      background: accentColor,
                    }}
                  />
                  <div style={{ paddingLeft: 6, flexShrink: 0, minWidth: 50 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: accentColor,
                        lineHeight: 1,
                        fontVariantNumeric: "tabular-nums",
                        textDecoration: dimmed ? "line-through" : "none",
                      }}
                    >
                      {time}
                    </div>
                    {lesson.durationMinutes ? (
                      <div style={{ fontSize: 12, color: IOS.secondaryLabel, marginTop: 3 }}>
                        {durationLabel(lesson.durationMinutes)}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: IOS.label,
                          letterSpacing: -0.1,
                          textDecoration: dimmed ? "line-through" : "none",
                        }}
                      >
                        {sentenceName(lesson.pupilName)}
                      </span>
                      {showReview && <StatusPill kind="review" dimmed={dimmed} />}
                      {state === "live" && <StatusPill kind="live" />}
                      {state === "completed" && <StatusPill kind="done" />}
                      {isConflict && state === "upcoming" && <StatusPill kind="conflict" />}
                      {lesson.status !== "cancelled" && state !== "completed" && (
                        <span
                          aria-label={isPaid ? "Paid" : "Not paid"}
                          style={{
                            background: isPaid ? "#E8F8ED" : "#FFECEC",
                            color: isPaid ? "#1A7A3C" : "#D33B3B",
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "1px 6px",
                            borderRadius: 8,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: 3,
                              background: isPaid ? "#1A7A3C" : "#D33B3B",
                              display: "inline-block",
                            }}
                          />
                          {isPaid ? "Paid" : "Not paid"}
                        </span>
                      )}
                    </div>
                    {subtitleText && (
                      <div
                        style={{
                          fontSize: 12,
                          color: IOS.secondaryLabel,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <MapPinIcon size={12} color={IOS.secondaryLabel} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{subtitleText}</span>
                      </div>
                    )}
                    {state === "live" && (
                      <div style={{ fontSize: 11, color: IOS.systemBlue, fontWeight: 500, margin: "6px 0 0" }}>
                        In progress · {minutesRemaining} min remaining
                      </div>
                    )}
                    {showEOL && <EOLPrompt onTap={() => openEOLWizard(lesson)} done={eolDone} />}
                  </div>

                  <ChevronRight color={IOS.tertiaryLabel} size={16} />
                </Link>
              );

              return (
                <div key={lesson.id}>
                  {showBannerAbove && firstConflictTime && <ConflictBanner time={firstConflictTime} />}
                  {card}
                </div>
              );
            })}
          </div>
        )}

        {/* FOOTER */}
        <div
          style={{
            borderTop: `0.5px solid ${IOS.opaqueSeparator}`,
            paddingTop: 14,
            marginTop: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Link
            to="/instructor/schedule"
            className="hts-link"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "transparent",
              padding: "6px 0",
              color: IOS.systemBlue,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            View full calendar
            <ChevronRight color={IOS.systemBlue} size={12} />
          </Link>
          <button
            onClick={() => setAddOpen(true)}
            className="hts-add"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: IOS.systemBlue,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: IOS_FONT,
            }}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
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
            queryClient.invalidateQueries({ queryKey: ["day-lessons"] });
          }}
        />
      )}

      {instructorId && wizardLesson && (
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
          lessonDate={format(targetDate, "yyyy-MM-dd")}
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
