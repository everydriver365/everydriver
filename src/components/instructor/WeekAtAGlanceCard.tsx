import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Calendar, Clock } from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { a11yPx } from "@/lib/a11yScale";
import { haptics } from "@/lib/haptics";
import {
  useInstructorPeriodStats,
  type RingsPeriod,
} from "@/hooks/useInstructorPeriodStats";
import {
  loadGoals,
  saveGoals,
  getDefaultGoals,
  hasCustomGoals,
  type AllGoals,
  type PeriodGoals,
} from "@/lib/instructorGoals";
import { IOSSheet, IOSSheetBody, IOSSheetHeader, IOSSheetTitle } from "@/components/ui/IOSSheet";

/* -------------------------------------------------------------------------- */
/*                               Design tokens                                */
/* -------------------------------------------------------------------------- */

const TXT = {
  primary: "#000000",
  secondary: "#6E6E73",
  hairline: "#E5E5EA",
  blue: "#2B7BC8",
  blueTint: "#E6F1FB",
  red: "#C8434F",
  redTint: "#FBEAEC",
  green: "#3B8B3B",
  greenTint: "#E8F3E8",
};

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

/* -------------------------------------------------------------------------- */
/*                                Period meta                                 */
/* -------------------------------------------------------------------------- */

const PERIOD_ORDER: RingsPeriod[] = ["today", "week", "month"];

const PERIOD_META: Record<
  RingsPeriod,
  {
    label: string;
    eyebrow: string;
    centerLabel: string;
    resetCadence: string;
  }
> = {
  today: {
    label: "Today",
    eyebrow: "Today · goals",
    centerLabel: "Today",
    resetCadence: "Day resets at midnight",
  },
  week: {
    label: "This week",
    eyebrow: "This week · goals",
    centerLabel: "Week",
    resetCadence: "Week resets every Monday",
  },
  month: {
    label: "This month",
    eyebrow: "This month · goals",
    centerLabel: "Month",
    resetCadence: "Month resets on the 1st",
  },
};

function formatRangeLabel(period: RingsPeriod): string {
  const now = new Date();
  if (period === "today") return format(now, "EEE d MMM");
  if (period === "week") {
    const s = startOfWeek(now, { weekStartsOn: 1 });
    const e = endOfWeek(now, { weekStartsOn: 1 });
    return `${format(s, "EEE d")} – ${format(e, "EEE d")}`;
  }
  return format(now, "MMMM yyyy");
}

/* -------------------------------------------------------------------------- */
/*                              Ring composition                              */
/* -------------------------------------------------------------------------- */

interface RingDef {
  key: "lessons" | "earnings" | "hours";
  radius: number;
  color: string;
  track: string;
}

const RINGS: RingDef[] = [
  { key: "lessons", radius: 68, color: TXT.red, track: TXT.redTint },
  { key: "earnings", radius: 54, color: TXT.blue, track: TXT.blueTint },
  { key: "hours", radius: 40, color: TXT.green, track: TXT.greenTint },
];

const STROKE_WIDTH = 8;

function clampPct(value: number, goal: number): number {
  if (!goal || goal <= 0) return 0;
  return Math.max(0, Math.min(1, value / goal));
}

interface ProgressRingsProps {
  progress: { lessons: number; earnings: number; hours: number }; // 0..1
}

function ProgressRings({ progress }: ProgressRingsProps) {
  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      <g transform="rotate(-90 80 80)">
        {RINGS.map((ring) => {
          const c = 2 * Math.PI * ring.radius;
          const pct = progress[ring.key];
          return (
            <g key={ring.key}>
              <circle
                cx={80}
                cy={80}
                r={ring.radius}
                fill="none"
                stroke={ring.track}
                strokeWidth={STROKE_WIDTH}
              />
              <motion.circle
                cx={80}
                cy={80}
                r={ring.radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                strokeDasharray={c}
                initial={false}
                animate={{ strokeDashoffset: c * (1 - pct) }}
                transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Animated count number                           */
/* -------------------------------------------------------------------------- */

function AnimatedPercent({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    const dur = 350;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{display}%</>;
}

/* -------------------------------------------------------------------------- */
/*                              Goals editor sheet                            */
/* -------------------------------------------------------------------------- */

interface GoalsEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: AllGoals;
  initialPeriod: RingsPeriod;
  onSave: (goals: AllGoals) => void;
}

function GoalsEditor({
  open,
  onOpenChange,
  initial,
  initialPeriod,
  onSave,
}: GoalsEditorProps) {
  const [draft, setDraft] = useState<AllGoals>(initial);
  const [period, setPeriod] = useState<RingsPeriod>(initialPeriod);

  useEffect(() => {
    if (open) {
      setDraft(initial);
      setPeriod(initialPeriod);
    }
  }, [open, initial, initialPeriod]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const current = draft[period];

  const update = (key: keyof PeriodGoals, raw: string) => {
    const num = Math.max(0, Math.round(Number(raw) || 0));
    setDraft((d) => ({ ...d, [period]: { ...d[period], [key]: num } }));
  };

  const reset = () => {
    setDraft({
      today: getDefaultGoals("today"),
      week: getDefaultGoals("week"),
      month: getDefaultGoals("month"),
    });
  };

  return (
    <IOSSheet open={open} onOpenChange={onOpenChange} snapPoints={[0.7, 0.95]}>
      <IOSSheetHeader>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              fontSize: 15,
              color: TXT.blue,
              fontFamily: FONT_STACK,
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <IOSSheetTitle>Goals</IOSSheetTitle>
          <button
            type="button"
            disabled={!dirty}
            onClick={() => {
              haptics.selection();
              onSave(draft);
              onOpenChange(false);
            }}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              fontSize: 15,
              fontWeight: 600,
              color: dirty ? TXT.blue : "#C7C7CC",
              fontFamily: FONT_STACK,
              textAlign: "right",
              cursor: dirty ? "pointer" : "default",
            }}
          >
            Save
          </button>
        </div>
      </IOSSheetHeader>
      <IOSSheetBody>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, paddingTop: 12 }}>
          {/* Period selector */}
          <div
            role="tablist"
            style={{
              padding: 4,
              background: "#F2F2F4",
              borderRadius: 10,
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 4,
            }}
          >
            {PERIOD_ORDER.map((p) => {
              const active = p === period;
              return (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: "8px 0",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: active ? 500 : 400,
                    color: active ? "#000000" : TXT.secondary,
                    background: active ? "#FFFFFF" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: FONT_STACK,
                  }}
                >
                  {PERIOD_META[p].label}
                </button>
              );
            })}
          </div>

          <GoalField
            label="Lessons"
            iconBg={TXT.redTint}
            iconColor={TXT.red}
            icon={<Calendar size={14} strokeWidth={1.8} color={TXT.red} />}
            value={current.lessons}
            onChange={(v) => update("lessons", v)}
            suffix=""
          />
          <GoalField
            label="Earnings"
            iconBg={TXT.blueTint}
            iconColor={TXT.blue}
            icon={
              <span style={{ fontSize: 13, fontWeight: 500, color: TXT.blue, lineHeight: 1 }}>
                £
              </span>
            }
            value={current.earnings}
            onChange={(v) => update("earnings", v)}
            prefix="£"
          />
          <GoalField
            label="Hours taught"
            iconBg={TXT.greenTint}
            iconColor={TXT.green}
            icon={<Clock size={14} strokeWidth={1.8} color={TXT.green} />}
            value={current.hours}
            onChange={(v) => update("hours", v)}
            suffix="h"
          />

          <button
            type="button"
            onClick={reset}
            style={{
              background: "transparent",
              border: "none",
              padding: "8px 0",
              fontSize: 13,
              fontWeight: 500,
              color: TXT.blue,
              cursor: "pointer",
              alignSelf: "center",
              fontFamily: FONT_STACK,
            }}
          >
            Reset to defaults
          </button>
        </div>
      </IOSSheetBody>
    </IOSSheet>
  );
}

interface GoalFieldProps {
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: number;
  onChange: (raw: string) => void;
  prefix?: string;
  suffix?: string;
}

function GoalField({
  label,
  icon,
  iconBg,
  value,
  onChange,
  prefix,
  suffix,
}: GoalFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: TXT.secondary,
          letterSpacing: 0.3,
          textTransform: "uppercase",
          fontFamily: FONT_STACK,
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#F7F7F8",
          border: `0.5px solid ${TXT.hairline}`,
          borderRadius: 10,
          padding: "10px 12px",
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: iconBg,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
          {prefix && (
            <span style={{ fontSize: 17, color: TXT.primary, fontFamily: FONT_STACK }}>
              {prefix}
            </span>
          )}
          <input
            inputMode="numeric"
            type="number"
            min={0}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 17,
              fontWeight: 500,
              color: TXT.primary,
              fontFamily: FONT_STACK,
              padding: 0,
              minWidth: 0,
            }}
          />
          {suffix && (
            <span style={{ fontSize: 13, color: TXT.secondary, fontFamily: FONT_STACK }}>
              {suffix}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Main card                                  */
/* -------------------------------------------------------------------------- */

interface WeekAtAGlanceCardProps {
  instructorId: string | undefined;
}

export function WeekAtAGlanceCard({ instructorId }: WeekAtAGlanceCardProps) {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<RingsPeriod>("today");
  const [goals, setGoals] = useState<AllGoals>(() => loadGoals(instructorId));
  const [editorOpen, setEditorOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const customised = useMemo(() => hasCustomGoals(instructorId), [instructorId]);

  useEffect(() => {
    setGoals(loadGoals(instructorId));
  }, [instructorId]);

  const { data: stats } = useInstructorPeriodStats(instructorId, period);
  const lessons = stats?.lessons ?? 0;
  const earnings = stats?.earnings ?? 0;
  const hours = stats?.hours ?? 0;

  const goal = goals[period];
  const lessonsPct = clampPct(lessons, goal.lessons);
  const earningsPct = clampPct(earnings, goal.earnings);
  const hoursPct = clampPct(hours, goal.hours);
  const overall = Math.round(((lessonsPct + earningsPct + hoursPct) / 3) * 100);

  /* swipe handling */
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
    const idx = PERIOD_ORDER.indexOf(period);
    const nextIdx =
      dx < 0 ? Math.min(PERIOD_ORDER.length - 1, idx + 1) : Math.max(0, idx - 1);
    if (nextIdx !== idx) {
      haptics.selection();
      setPeriod(PERIOD_ORDER[nextIdx]);
    }
  };

  const meta = PERIOD_META[period];

  const currencyFormatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  });

  const goEarnings = () => navigate("/instructor/pay");
  const goLessons = () => navigate("/instructor/schedule");
  const goHours = () => navigate("/instructor/schedule");

  const handleSaveGoals = (next: AllGoals) => {
    setGoals(next);
    saveGoals(instructorId, next);
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => {
          haptics.selection();
          setExpanded(true);
        }}
        style={{
          background: "#FFFFFF",
          border: `0.5px solid ${TXT.hairline}`,
          borderRadius: a11yPx(12),
          padding: 16,
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
          fontFamily: FONT_STACK,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
        aria-label="Show progress rings"
      >
        <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
          <svg width={56} height={56} viewBox="0 0 160 160">
            <g transform="rotate(-90 80 80)">
              {RINGS.map((ring) => {
                const c = 2 * Math.PI * ring.radius;
                const pct =
                  ring.key === "lessons"
                    ? lessonsPct
                    : ring.key === "earnings"
                    ? earningsPct
                    : hoursPct;
                return (
                  <g key={ring.key}>
                    <circle cx={80} cy={80} r={ring.radius} fill="none" stroke={ring.track} strokeWidth={STROKE_WIDTH} />
                    <circle
                      cx={80}
                      cy={80}
                      r={ring.radius}
                      fill="none"
                      stroke={ring.color}
                      strokeWidth={STROKE_WIDTH}
                      strokeLinecap="round"
                      strokeDasharray={c}
                      strokeDashoffset={c * (1 - pct)}
                    />
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: TXT.secondary,
              letterSpacing: "0.3px",
              textTransform: "uppercase",
              margin: "0 0 4px",
            }}
          >
            {meta.eyebrow}
          </p>
          <p style={{ fontSize: 15, fontWeight: 500, color: TXT.primary, margin: 0, letterSpacing: "-0.2px" }}>
            {overall}% of goals
          </p>
          <p style={{ fontSize: 12, color: TXT.secondary, margin: "2px 0 0" }}>
            Tap to view rings
          </p>
        </div>
      </button>
    );
  }

  return (
    <>
      <div
        style={{
          background: "#FFFFFF",
          border: `0.5px solid ${TXT.hairline}`,
          borderRadius: a11yPx(12),
          padding: 16,
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: TXT.secondary,
              letterSpacing: "0.3px",
              textTransform: "uppercase",
              margin: 0,
              fontFamily: FONT_STACK,
            }}
          >
            {meta.eyebrow}
          </p>
          <button
            type="button"
            onClick={() => {
              haptics.selection();
              setExpanded(false);
            }}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: TXT.blue,
              fontSize: 12,
              fontWeight: 500,
              fontFamily: FONT_STACK,
              cursor: "pointer",
            }}
            aria-label="Hide rings"
          >
            <span>{formatRangeLabel(period)}</span>
            <ChevronDown size={10} strokeWidth={1.6} color={TXT.blue} style={{ transform: "rotate(180deg)" }} />
          </button>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: TXT.blue,
              fontSize: 12,
              fontWeight: 500,
              fontFamily: FONT_STACK,
            }}
          >
            <span>{formatRangeLabel(period)}</span>
            <ChevronDown size={10} strokeWidth={1.6} color={TXT.blue} />
          </div>
        </div>

        {/* Segmented control */}
        <div
          role="tablist"
          aria-label="Period"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 4,
            background: "#F2F2F4",
            borderRadius: 8,
            padding: 3,
            marginBottom: 16,
          }}
        >
          {PERIOD_ORDER.map((p) => {
            const active = p === period;
            return (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  if (p !== period) {
                    haptics.selection();
                    setPeriod(p);
                  }
                }}
                style={{
                  padding: "6px 0",
                  borderRadius: 6,
                  background: active ? "#FFFFFF" : "transparent",
                  border: "none",
                  fontSize: 12,
                  fontWeight: active ? 500 : 400,
                  color: active ? "#000000" : TXT.secondary,
                  cursor: "pointer",
                  fontFamily: FONT_STACK,
                }}
              >
                {PERIOD_META[p].label}
              </button>
            );
          })}
        </div>

        {/* Ring composition */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ position: "relative", width: 160, height: 160 }}>
            <ProgressRings
              progress={{
                lessons: lessonsPct,
                earnings: earningsPct,
                hours: hoursPct,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: TXT.secondary,
                  letterSpacing: "0.3px",
                  textTransform: "uppercase",
                  margin: 0,
                  fontFamily: FONT_STACK,
                }}
              >
                {meta.centerLabel}
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={period}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    fontSize: 22,
                    fontWeight: 500,
                    color: TXT.primary,
                    letterSpacing: "-0.3px",
                    lineHeight: 1.1,
                    margin: 0,
                    fontFamily: FONT_STACK,
                  }}
                >
                  <AnimatedPercent value={overall} />
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Page indicator dots */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginBottom: 14,
          }}
        >
          {PERIOD_ORDER.map((p) => (
            <span
              key={p}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: p === period ? "#000000" : "#C7C7CC",
              }}
            />
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <LegendRow
            color={TXT.red}
            name="Lessons"
            value={`${lessons} of ${goal.lessons}`}
            pct={Math.round(lessonsPct * 100)}
            onClick={goLessons}
          />
          <LegendRow
            color={TXT.blue}
            name="Earned"
            value={`${currencyFormatter.format(earnings)} of ${currencyFormatter.format(goal.earnings)}`}
            pct={Math.round(earningsPct * 100)}
            onClick={goEarnings}
          />
          <LegendRow
            color={TXT.green}
            name="Hours taught"
            value={`${hours} of ${goal.hours}`}
            pct={Math.round(hoursPct * 100)}
            onClick={goHours}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: `0.5px solid ${TXT.hairline}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: TXT.secondary,
              margin: 0,
              fontFamily: FONT_STACK,
            }}
          >
            {meta.resetCadence}
          </p>
          <button
            type="button"
            onClick={() => {
              haptics.selection();
              setEditorOpen(true);
            }}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              fontSize: 11,
              fontWeight: 500,
              color: TXT.blue,
              cursor: "pointer",
              fontFamily: FONT_STACK,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {customised ? "Edit goals" : "Set goals"}
            {!customised && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: TXT.blue,
                }}
              />
            )}
          </button>
        </div>
      </div>

      <GoalsEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initial={goals}
        initialPeriod={period}
        onSave={handleSaveGoals}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Legend row                                  */
/* -------------------------------------------------------------------------- */

interface LegendRowProps {
  color: string;
  name: string;
  value: string;
  pct: number;
  onClick: () => void;
}

function LegendRow({ color, name, value, pct, onClick }: LegendRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        padding: "6px 4px",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        fontFamily: FONT_STACK,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: TXT.primary,
          letterSpacing: "-0.1px",
          flexShrink: 0,
        }}
      >
        {name}
      </span>
      <span
        style={{
          fontSize: 13,
          color: TXT.secondary,
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color,
          minWidth: 32,
          textAlign: "right",
        }}
      >
        {pct}%
      </span>
    </button>
  );
}
