import { useMemo } from "react";
import type { AICallDivertState } from "@/hooks/useAICallDivert";

/* Spec tokens */
const PURPLE = "#534AB7";
const GREEN = "#1D9E75";
const NEAR_BLACK = "#1A1A1A";
const MUTED = "#6B7280";
const BORDER = "rgba(15,23,42,0.08)";
const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", system-ui, sans-serif';

const tileBase: React.CSSProperties = {
  background: "#FFFFFF",
  border: `0.5px solid ${BORDER}`,
  borderRadius: 8,
  padding: "8px 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  minWidth: 0,
  fontFamily: FONT,
  whiteSpace: "nowrap",
  minHeight: 36,
};

interface TopStatsRowProps {
  ai: AICallDivertState;
  onOpenAISheet: () => void;
  earningsToday: number;
  todayLessons: number;
  earningsDelta?: number | null;
  hoursThisWeek: number;
  hoursGoal: number;
  lessonsThisWeek: number;
  lessonsGoal: number;
  waitingCount?: number;
}

export function TopStatsRow({
  ai,
  onOpenAISheet,
  earningsToday,
  hoursThisWeek,
  hoursGoal,
}: TopStatsRowProps) {
  const aiOn = ai.toggleOn;

  const divertUntil = useMemo(() => {
    if (!aiOn) return "off";
    if (ai.windowEnd) {
      return `until ${ai.windowEnd.toLocaleTimeString("en-GB", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    }
    return ai.statusLine;
  }, [aiOn, ai.windowEnd, ai.statusLine]);

  const toggleAI = (e: React.MouseEvent) => {
    e.stopPropagation();
    ai.setMode(aiOn ? "off" : "auto");
  };

  return (
    <div style={{ padding: "0 14px 12px" }}>
      <h2 className="sr-only">
        Tutoring dashboard: AI auto-divert status, today's earnings, weekly hours.
      </h2>
      <div className="ts-row">
        {/* TILE 1 — AI Auto-divert */}
        <button
          type="button"
          onClick={onOpenAISheet}
          aria-label="Open AI receptionist settings"
          style={{ ...tileBase, gap: 10, cursor: "pointer", textAlign: "left" }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: aiOn ? GREEN : "#D1D5DB",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: NEAR_BLACK,
              }}
            >
              Auto-divert
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: MUTED,
              }}
            >
              {divertUntil}
            </span>
          </span>
          <span
            role="switch"
            aria-checked={aiOn}
            aria-label="Toggle AI auto-divert"
            onClick={toggleAI}
            style={{
              width: 28,
              height: 16,
              borderRadius: 999,
              background: aiOn ? PURPLE : "#D1D5DB",
              position: "relative",
              transition: "background 180ms ease",
              cursor: "pointer",
              flexShrink: 0,
              display: "inline-block",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 2,
                left: aiOn ? 14 : 2,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#FFFFFF",
                transition: "left 180ms ease",
              }}
            />
          </span>
        </button>

        {/* TILE 2 — Today's earnings */}
        <div style={{ ...tileBase, gap: 6 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: NEAR_BLACK,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            £{Math.round(earningsToday)}
          </span>
          <span style={{ fontSize: 11, fontWeight: 400, color: MUTED }}>today</span>
        </div>

        {/* TILE 3 — Week hours */}
        <div style={{ ...tileBase, gap: 6 }}>
          <span style={{ whiteSpace: "nowrap" }}>
            <span
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: NEAR_BLACK,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {hoursThisWeek}h
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: MUTED,
              }}
            >
              {" "}/ {hoursGoal}h
            </span>
          </span>
          <span style={{ fontSize: 11, fontWeight: 400, color: MUTED }}>week</span>
        </div>
      </div>

      <style>{`
        .ts-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto auto;
          align-items: stretch;
          gap: 6px;
        }
        @media (max-width: 640px) {
          /* Single row preserved per product direction */
        }
      `}</style>
    </div>
  );
}
