import type { AICallDivertState } from "@/hooks/useAICallDivert";

/* Spec tokens */
const PURPLE = "#534AB7";
const GREEN = "#1D9E75";
const RED = "#E5484D";
const NEAR_BLACK = "#1A1A1A";
const MUTED = "#6B7280";
const BORDER = "rgba(15,23,42,0.08)";
const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", system-ui, sans-serif';

const cardBase: React.CSSProperties = {
  background: "#FFFFFF",
  border: `0.5px solid ${BORDER}`,
  borderRadius: 12,
  padding: "4px 10px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  minWidth: 0,
  fontFamily: FONT,
  gap: 6,
};

const upperLabel = (color: string): React.CSSProperties => ({
  fontSize: 10,
  fontWeight: 500,
  color,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  lineHeight: 1.1,
});

const dot = (color: string, pulse = false): React.CSSProperties => ({
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: color,
  flexShrink: 0,
  display: "inline-block",
  animation: pulse ? "ts-pulse 1.4s ease-in-out infinite" : undefined,
});

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
  /** Number of items waiting on the user (e.g. unread/needs-action). When > 0, shows pulsing red dot on Today card. */
  waitingCount?: number;
}

export function TopStatsRow({
  ai,
  onOpenAISheet,
  earningsToday,
  todayLessons,
  earningsDelta,
  hoursThisWeek,
  hoursGoal,
  lessonsThisWeek,
  lessonsGoal,
  waitingCount = 0,
}: TopStatsRowProps) {
  const aiOn = ai.toggleOn;
  const weekProgress = hoursGoal > 0 ? Math.min(100, (hoursThisWeek / hoursGoal) * 100) : 0;
  const showDelta = typeof earningsDelta === "number" && earningsDelta > 0;
  const hasWaiting = waitingCount > 0;

  return (
    <div style={{ padding: "0 14px 12px" }}>
      <div className="ts-row">
        {/* CARD 1 — AI Receptionist */}
        <button
          type="button"
          onClick={onOpenAISheet}
          aria-label="Open AI receptionist settings"
          style={{ ...cardBase, cursor: "pointer", textAlign: "left" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              {aiOn && <span style={dot(GREEN)} aria-label="AI divert active" />}
              <span className="ts-label" style={upperLabel(PURPLE)}>AI</span>
            </div>
            <span
              role="switch"
              aria-checked={aiOn}
              onClick={(e) => {
                e.stopPropagation();
                ai.setMode(aiOn ? "off" : "auto");
              }}
              style={{
                width: 30,
                height: 18,
                borderRadius: 999,
                background: aiOn ? PURPLE : "#D1D5DB",
                position: "relative",
                transition: "background 180ms ease",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: aiOn ? 14 : 2,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  transition: "left 180ms ease",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
                }}
              />
            </span>
          </div>
          <div>
            <div
              className="ts-main"
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: NEAR_BLACK,
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {aiOn ? "Auto-divert on" : "Auto-divert off"}
            </div>
            <div
              className="ts-sub"
              style={{
                fontSize: 11,
                color: MUTED,
                marginTop: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {ai.statusLine}
            </div>
          </div>
        </button>

        {/* CARD 2 — Today */}
        <div style={cardBase}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              {hasWaiting && <span style={dot(RED, true)} aria-label={`${waitingCount} waiting`} />}
              <span className="ts-label" style={upperLabel(MUTED)}>Today</span>
            </div>
          </div>
          <div>
            <div
              className="ts-value"
              style={{
                fontSize: 20,
                fontWeight: 500,
                color: NEAR_BLACK,
                lineHeight: 1.05,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.3px",
              }}
            >
              £{Math.round(earningsToday)}
              {showDelta && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: GREEN,
                    marginLeft: 6,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: 0,
                  }}
                >
                  +£{Math.round(earningsDelta!)}
                </span>
              )}
            </div>
            <div className="ts-sub" style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
              {todayLessons} lesson{todayLessons === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        {/* CARD 3 — This week */}
        <div style={cardBase}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
            <span className="ts-label" style={upperLabel(MUTED)}>Week</span>
          </div>
          <div>
            <div
              className="ts-value"
              style={{
                fontSize: 20,
                fontWeight: 500,
                color: NEAR_BLACK,
                lineHeight: 1.05,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.3px",
                display: "inline-flex",
                alignItems: "baseline",
                gap: 3,
              }}
            >
              {hoursThisWeek}h
              <span style={{ fontSize: 12, fontWeight: 400, color: MUTED }}>
                / {hoursGoal}h
              </span>
            </div>
            <div
              style={{
                marginTop: 5,
                height: 3,
                background: "#E1F5EE",
                borderRadius: 999,
                overflow: "hidden",
              }}
              aria-hidden
            >
              <div
                style={{
                  width: `${weekProgress}%`,
                  height: "100%",
                  background: GREEN,
                  borderRadius: 999,
                  transition: "width 240ms ease",
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>
              {lessonsThisWeek}/{lessonsGoal} lesson{lessonsGoal === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ts-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px;
        }
        @keyframes ts-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.25); }
        }
      `}</style>
    </div>
  );
}
