import { useMemo } from "react";
import { Phone } from "lucide-react";
import type { AICallDivertState } from "@/hooks/useAICallDivert";

/* Brand tokens */
const RED = "#DC2626";
const GREEN = "#10A37F";
const SOFT_GREEN = "#ECFDF5";
const SOFT_RED = "#FEF2F2";
const LIGHT_GRAY = "#E5E5E5";
const BLUE = "#2563EB";
const NEAR_BLACK = "#1A1A1A";
const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", system-ui, sans-serif';
const TILE_INSET = "inset 0 0 0 0.5px rgba(26,26,26,0.08)";

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
  todayLessons,
  earningsDelta,
  hoursThisWeek,
  hoursGoal,
}: TopStatsRowProps) {
  const aiOn = ai.toggleOn;
  const ACCENT = aiOn ? GREEN : RED;
  const ACCENT_SOFT = aiOn ? SOFT_GREEN : SOFT_RED;

  const resumesText = useMemo(() => {
    const target = ai.windowEnd && ai.insideWindow
      ? ai.windowEnd
      : ai.windowStart ?? null;
    if (!target) return "Calls handled by AI";
    return `Resumes calls at ${target.toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  }, [ai.windowEnd, ai.windowStart, ai.insideWindow]);

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
            position: "relative",
            overflow: "hidden",
            background: "#FFFFFF",
            boxShadow: TILE_INSET,
            border: "none",
            borderRadius: 10,
            padding: "10px 14px",
            minHeight: 52,
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
          {/* Always-visible red side stripe */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: 3,
              background: ACCENT,
            }}
          />

          {/* Left content */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              minWidth: 0,
              paddingLeft: 4,
            }}
          >
            {/* Icon tile */}
            <span
              style={{
                position: "relative",
                width: 32,
                height: 32,
                borderRadius: 9,
                background: ACCENT_SOFT,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Phone size={16} strokeWidth={2} color={ACCENT} />
              {aiOn && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    width: 8,
                    height: 8,
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background: ACCENT,
                      border: "1.5px solid #FFFFFF",
                      boxSizing: "border-box",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background: ACCENT,
                      animation: "ts-pulse 2s ease-out infinite",
                    }}
                  />
                </span>
              )}
            </span>

            {/* Text block */}
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
                  fontWeight: 500,
                  color: ACCENT,
                  lineHeight: 1.3,
                }}
              >
                {aiOn ? "On" : "Off"}
              </span>
            </span>
          </span>

          {/* Toggle */}
          <span
            role="switch"
            aria-checked={aiOn}
            aria-label="Toggle auto-divert"
            onClick={toggleAI}
            style={{
              width: 30,
              height: 17,
              borderRadius: 999,
              background: aiOn ? ACCENT : LIGHT_GRAY,
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
                left: aiOn ? 15 : 2,
                width: 13,
                height: 13,
                borderRadius: "50%",
                background: "#FFFFFF",
                boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                transition: "left 180ms ease",
              }}
            />
          </span>
        </button>

        {/* TILE 2 — Today's earnings */}
        <div
          style={{
            background: "#FFFFFF",
            boxShadow: TILE_INSET,
            borderRadius: 10,
            padding: "8px 8px",
            minHeight: 52,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: 3 }}>
            <span
              style={{
                fontSize: 17,
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
                  fontSize: 10,
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
              opacity: 0.5,
              marginTop: 3,
              lineHeight: 1,
            }}
          >
            {todayLessons} today
          </span>
        </div>

        {/* TILE 3 — Week hours */}
        <div
          style={{
            background: "#FFFFFF",
            boxShadow: TILE_INSET,
            borderRadius: 10,
            padding: "8px 8px",
            minHeight: 52,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          <span style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "baseline", gap: 3 }}>
            <span style={{ fontSize: 17, fontWeight: 500, color: NEAR_BLACK, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              {hoursThisWeek}
            </span>
            <span style={{ fontSize: 10, fontWeight: 400, color: NEAR_BLACK, opacity: 0.5, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              /{hoursGoal}h
            </span>
          </span>
          <div
            style={{
              width: "100%",
              height: 3,
              background: "rgba(26,26,26,0.08)",
              borderRadius: 999,
              overflow: "hidden",
              marginTop: 5,
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
          gap: 8px;
        }
        @media (max-width: 640px) {
          .ts-row {
            /* Keep horizontal per current product direction */
          }
        }
        @keyframes ts-pulse {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
