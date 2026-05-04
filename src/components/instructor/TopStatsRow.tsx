import { Phone, Sparkles, Wallet, Clock } from "lucide-react";
import type { AICallDivertState } from "@/hooks/useAICallDivert";

/* Spec tokens */
const PURPLE = "#534AB7";
const PURPLE_TINT = "#EEEDFE";
const BLUE = "#185FA5";
const BLUE_TINT = "#E6F1FB";
const TEAL = "#0F6E56";
const TEAL_DARK = "#1D9E75";
const TEAL_TINT = "#E1F5EE";
const NEAR_BLACK = "#1A1A1A";
const MUTED = "#6B7280";
const BORDER = "rgba(15,23,42,0.08)";
const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", system-ui, sans-serif';

const cardBase: React.CSSProperties = {
  background: "#FFFFFF",
  border: `0.5px solid ${BORDER}`,
  borderRadius: 12,
  padding: "14px 16px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  minWidth: 0,
  fontFamily: FONT,
};

const upperLabel = (color: string): React.CSSProperties => ({
  fontSize: 11,
  fontWeight: 500,
  color,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  lineHeight: 1.1,
});

const iconTile = (size: number, bg: string, color: string): React.CSSProperties => ({
  width: size,
  height: size,
  borderRadius: 8,
  background: bg,
  color,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
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
}: TopStatsRowProps) {
  const aiOn = ai.toggleOn;
  const weekProgress = hoursGoal > 0 ? Math.min(100, (hoursThisWeek / hoursGoal) * 100) : 0;
  const showDelta = typeof earningsDelta === "number" && earningsDelta > 0;

  return (
    <div
      style={{
        padding: "0 14px 12px",
      }}
    >
      <div className="ts-row">
        {/* CARD 1 — AI Receptionist */}
        <button
          type="button"
          onClick={onOpenAISheet}
          aria-label="Open AI receptionist settings"
          style={{
            ...cardBase,
            cursor: "pointer",
            textAlign: "left",
            minHeight: 130,
          }}
        >
          {/* Top row: icon tile + toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ ...iconTile(32, PURPLE_TINT, PURPLE), position: "relative" }}>
              <Phone size={15} strokeWidth={2} />
              <Sparkles
                size={9}
                strokeWidth={2.2}
                style={{ position: "absolute", top: 4, right: 4 }}
              />
            </span>
            <span
              role="switch"
              aria-checked={aiOn}
              onClick={(e) => {
                e.stopPropagation();
                void ai.toggleOn === aiOn && ai.setMode(aiOn ? "off" : "auto");
              }}
              style={{
                width: 36,
                height: 20,
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
                  left: aiOn ? 18 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  transition: "left 180ms ease",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
                }}
              />
            </span>
          </div>

          {/* Bottom: label + main + sub */}
          <div>
            <div style={upperLabel(PURPLE)}>AI Receptionist</div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: NEAR_BLACK,
                marginTop: 4,
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {aiOn ? "Auto-divert on" : "Auto-divert off"}
            </div>
            <div
              style={{
                fontSize: 12,
                color: MUTED,
                marginTop: 3,
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
        <div style={{ ...cardBase, minHeight: 130 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={upperLabel(MUTED)}>Today</div>
            <span style={iconTile(28, BLUE_TINT, BLUE)}>
              <Wallet size={14} strokeWidth={2} />
            </span>
          </div>
          <div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 500,
                color: NEAR_BLACK,
                lineHeight: 1.05,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.5px",
              }}
            >
              £{Math.round(earningsToday)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: MUTED }}>
                {todayLessons} lesson{todayLessons === 1 ? "" : "s"}
              </span>
              {showDelta && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: TEAL,
                    background: TEAL_TINT,
                    padding: "2px 7px",
                    borderRadius: 999,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  +£{Math.round(earningsDelta!)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CARD 3 — This week */}
        <div style={{ ...cardBase, minHeight: 130 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={upperLabel(MUTED)}>This week</div>
            <span style={iconTile(28, TEAL_TINT, TEAL)}>
              <Clock size={14} strokeWidth={2} />
            </span>
          </div>
          <div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 500,
                color: NEAR_BLACK,
                lineHeight: 1.05,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.5px",
                display: "inline-flex",
                alignItems: "baseline",
                gap: 4,
              }}
            >
              {hoursThisWeek}h
              <span style={{ fontSize: 16, fontWeight: 400, color: MUTED }}>
                / {hoursGoal}h
              </span>
            </div>
            <div
              style={{
                marginTop: 8,
                height: 4,
                background: TEAL_TINT,
                borderRadius: 999,
                overflow: "hidden",
              }}
              aria-hidden
            >
              <div
                style={{
                  width: `${weekProgress}%`,
                  height: "100%",
                  background: TEAL_DARK,
                  borderRadius: 999,
                  transition: "width 240ms ease",
                }}
              />
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>
              {lessonsThisWeek} of {lessonsGoal} lesson{lessonsGoal === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ts-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }
        @media (max-width: 360px) {
          .ts-row {
            grid-template-columns: 1fr;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
}
