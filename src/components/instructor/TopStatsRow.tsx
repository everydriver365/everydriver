import { useMemo } from "react";
import type { AICallDivertState } from "@/hooks/useAICallDivert";

/* Spec tokens (Option C) */
const GREEN = "#10A37F";
const SOFT_GREEN = "#ECFDF5";
const DARK_GREEN = "#065F46";
const BLUE = "#2563EB";
const NEAR_BLACK = "#1A1A1A";
const WARM_GRAY = "#F5F5F4";
const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", system-ui, sans-serif';

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
  earningsDelta,
  hoursThisWeek,
  hoursGoal,
}: TopStatsRowProps) {
  const aiOn = ai.toggleOn;

  const divertSubtext = useMemo(() => {
    if (!aiOn) return "Off";
    if (ai.windowEnd && ai.insideWindow) {
      return `Resumes ${ai.windowEnd.toLocaleTimeString("en-GB", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    }
    if (ai.windowStart) {
      return `Starts ${ai.windowStart.toLocaleTimeString("en-GB", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    }
    return ai.statusLine;
  }, [aiOn, ai.windowEnd, ai.windowStart, ai.insideWindow, ai.statusLine]);

  const toggleAI = (e: React.MouseEvent) => {
    e.stopPropagation();
    ai.setMode(aiOn ? "off" : "auto");
  };

  const progressPct = hoursGoal > 0
    ? Math.max(0, Math.min(100, (hoursThisWeek / hoursGoal) * 100))
    : 0;

  return (
    <div style={{ padding: "0 14px 12px", fontFamily: FONT }}>
      <h2 className="sr-only">
        Tutoring dashboard: AI auto-divert status, today's earnings, weekly hours.
      </h2>
      <div className="ts-row">
        {/* TILE 1 — AI Auto-divert */}
        <button
          type="button"
          onClick={onOpenAISheet}
          aria-label="Open AI receptionist settings"
          style={{
            background: aiOn ? SOFT_GREEN : WARM_GRAY,
            border: "none",
            borderRadius: 8,
            padding: "10px 14px",
            minHeight: 44,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            textAlign: "left",
            whiteSpace: "nowrap",
            minWidth: 0,
            fontFamily: FONT,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
            }}
          >
            {/* Pulsing status dot */}
            <span
              aria-hidden
              style={{
                position: "relative",
                width: 7,
                height: 7,
                flexShrink: 0,
                display: "inline-block",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: aiOn ? GREEN : "#D1D5DB",
                }}
              />
              {aiOn && (
                <span
                  style={{
                    position: "absolute",
                    inset: -3,
                    borderRadius: "50%",
                    background: GREEN,
                    animation: "ts-pulse 2s ease-out infinite",
                  }}
                />
              )}
            </span>
            <span
              style={{
                display: "inline-flex",
                flexDirection: "column",
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: NEAR_BLACK,
                  lineHeight: 1.2,
                }}
              >
                Auto-divert
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 400,
                  color: aiOn ? DARK_GREEN : "#6B7280",
                  lineHeight: 1.3,
                }}
              >
                {divertSubtext}
              </span>
            </span>
          </span>
          <span
            role="switch"
            aria-checked={aiOn}
            aria-label="Toggle AI auto-divert"
            onClick={toggleAI}
            style={{
              width: 26,
              height: 15,
              borderRadius: 999,
              background: aiOn ? GREEN : "#D1D5DB",
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
                left: aiOn ? 13 : 2,
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "#FFFFFF",
                transition: "left 180ms ease",
              }}
            />
          </span>
        </button>

        {/* TILE 2 — Today's earnings */}
        <div
          style={{
            background: WARM_GRAY,
            borderRadius: 8,
            padding: "8px 12px",
            minHeight: 44,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
            <span
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: NEAR_BLACK,
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              £{Math.round(earningsToday)}
            </span>
            {typeof earningsDelta === "number" && earningsDelta !== 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: BLUE,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                {earningsDelta > 0 ? "↑" : "↓"}{Math.abs(Math.round(earningsDelta))}
              </span>
            )}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 400,
              color: NEAR_BLACK,
              opacity: 0.55,
              marginTop: 2,
              lineHeight: 1,
            }}
          >
            today
          </span>
        </div>

        {/* TILE 3 — Week hours */}
        <div
          style={{
            background: WARM_GRAY,
            borderRadius: 8,
            padding: "8px 12px",
            minHeight: 44,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          <span style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "baseline", gap: 4 }}>
            <span
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: NEAR_BLACK,
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {hoursThisWeek}h
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 400,
                color: NEAR_BLACK,
                opacity: 0.5,
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              / {hoursGoal}h
            </span>
          </span>
          <div
            style={{
              width: "100%",
              height: 2,
              background: "rgba(26,26,26,0.1)",
              borderRadius: 999,
              overflow: "hidden",
              marginTop: 4,
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: BLUE,
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        .ts-row {
          display: grid;
          grid-template-columns: 3fr 1fr 1fr;
          align-items: stretch;
          gap: 6px;
        }
        @media (max-width: 640px) {
          .ts-row {
            /* Keep horizontal per current product direction */
          }
        }
        @keyframes ts-pulse {
          0% { transform: scale(1); opacity: 0.25; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
