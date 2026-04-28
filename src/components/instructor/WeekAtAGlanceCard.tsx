import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  format,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { a11yPx } from "@/lib/a11yScale";
import { haptics } from "@/lib/haptics";
import {
  useInstructorPeriodStats,
  type RingsPeriod,
} from "@/hooks/useInstructorPeriodStats";

/* -------------------------------------------------------------------------- */
/*                               Design tokens                                */
/* -------------------------------------------------------------------------- */

const TXT = {
  primary: "#000000",
  secondary: "#6E6E73",
  hairline: "#E5E5EA",
  blue: "#2B7BC8",
  red: "#C8434F",
  green: "#3B8B3B",
};

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

const PERIOD_ORDER: RingsPeriod[] = ["today", "week", "month"];

const PERIOD_LABEL: Record<RingsPeriod, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
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
/*                                 Main card                                  */
/* -------------------------------------------------------------------------- */

interface WeekAtAGlanceCardProps {
  instructorId: string | undefined;
}

export function WeekAtAGlanceCard({ instructorId }: WeekAtAGlanceCardProps) {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<RingsPeriod>("today");

  const { data: stats } = useInstructorPeriodStats(instructorId, period);
  const lessons = stats?.lessons ?? 0;
  const earnings = stats?.earnings ?? 0;
  const hours = stats?.hours ?? 0;

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

  const currencyFormatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  });

  const goEarnings = () => navigate("/instructor/pay");
  const goLessons = () => navigate("/instructor/schedule");
  const goHours = () => navigate("/instructor/schedule");

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: `0.5px solid ${TXT.hairline}`,
        borderRadius: a11yPx(12),
        padding: 16,
        fontFamily: FONT_STACK,
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
          }}
        >
          {PERIOD_LABEL[period]}
        </p>
        <span style={{ fontSize: 12, color: TXT.secondary }}>
          {formatRangeLabel(period)}
        </span>
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
          marginBottom: 14,
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
              {PERIOD_LABEL[p]}
            </button>
          );
        })}
      </div>

      {/* Stat row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        <StatBlock
          color={TXT.red}
          label="Lessons"
          value={`${lessons}`}
          onClick={goLessons}
        />
        <StatBlock
          color={TXT.blue}
          label="Earned"
          value={currencyFormatter.format(earnings)}
          onClick={goEarnings}
        />
        <StatBlock
          color={TXT.green}
          label="Hours"
          value={`${hours}`}
          onClick={goHours}
        />
      </div>
    </div>
  );
}

interface StatBlockProps {
  color: string;
  label: string;
  value: string;
  onClick: () => void;
}

function StatBlock({ color, label, value, onClick }: StatBlockProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        padding: "8px 4px",
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 4,
        cursor: "pointer",
        fontFamily: FONT_STACK,
        textAlign: "left",
        minWidth: 0,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          fontWeight: 500,
          color: TXT.secondary,
          letterSpacing: "0.2px",
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            display: "inline-block",
          }}
        />
        {label}
      </span>
      <span
        style={{
          fontSize: 20,
          fontWeight: 500,
          color: TXT.primary,
          letterSpacing: "-0.3px",
          lineHeight: 1.1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "100%",
        }}
      >
        {value}
      </span>
    </button>
  );
}
