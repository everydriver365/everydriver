import { useNavigate } from "react-router-dom";
import { CalendarPlus, Car, Sparkles, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface InsightTile {
  title: string;
  icon: LucideIcon;
  route: string;
  /** Solid background colour for the icon block */
  iconBg: string;
  /** Numeric/short metric value (omit for status-style tiles) */
  metricValue?: string | number;
  /** Unit shown after the metric (e.g. "wks left") */
  metricUnit?: string;
  /** Status text shown instead of a metric (e.g. "Tap to start") */
  statusText?: string;
  /** Status text colour */
  statusColor?: string;
  /** Show animated live dot inside the icon block */
  liveDot?: boolean;
  /** Ring colour for the live dot */
  liveDotRingColor?: string;
}

interface InsightTilesGridProps {
  gapCount?: number;
}

// Palette assigned in tile order, cycled if needed.
// Course planner indigo, Agenda blue, Pupils green, Track lesson red.
const PALETTE = ["#3B5CCC", "#0A84D1", "#2D8A47", "#C8384F"] as const;

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

export function InsightTilesGrid({ gapCount = 0 }: InsightTilesGridProps) {
  const navigate = useNavigate();

  // Preserve existing tile identities, routes, icons, and order.
  // Only restyle and bind metric placeholders per tile identity.
  const baseTiles: Omit<InsightTile, "iconBg">[] = [
    {
      title: "Fill gaps",
      icon: CalendarPlus,
      route: "/instructor/gaps",
      metricValue: gapCount,
      metricUnit: "open",
    },
    {
      title: "Vehicle health",
      icon: Car,
      route: "/instructor/vehicle-health",
      metricValue: "—",
      metricUnit: "status",
    },
    {
      title: "Smart nudges",
      icon: Sparkles,
      route: "/instructor/nudges",
      metricValue: "—",
      metricUnit: "actions",
    },
    {
      title: "Re-engage",
      icon: UserCheck,
      route: "/instructor/dormant-pupils",
      metricValue: "—",
      metricUnit: "dormant",
    },
  ];

  const tiles: InsightTile[] = baseTiles.map((t, i) => {
    const iconBg = PALETTE[i % PALETTE.length];
    // The 4th palette slot is the red "live" identity — give it a live dot.
    const isLive = i % PALETTE.length === 3;
    return {
      ...t,
      iconBg,
      ...(isLive
        ? {
            liveDot: true,
            liveDotRingColor: iconBg,
          }
        : {}),
    };
  });

  return (
    <>
      <style>{`
        @keyframes insight-tile-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .insight-tile-press {
          transition: transform 0.12s cubic-bezier(0.2, 0, 0.2, 1);
        }
        .insight-tile-press:active {
          transform: scale(0.97);
        }
        .insight-live-dot {
          animation: insight-tile-pulse 1.6s ease-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .insight-live-dot { animation: none; }
        }
      `}</style>
      <div
        style={{
          padding: "18px 14px 20px",
          background: "#F2F2F7",
          fontFamily: FONT_STACK,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 9,
          }}
        >
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.title}
                type="button"
                onClick={() => navigate(tile.route)}
                className="insight-tile-press"
                style={{
                  background: "#FFFFFF",
                  border: "none",
                  boxShadow: "none",
                  borderRadius: 14,
                  padding: 11,
                  minHeight: 84,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 11,
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: FONT_STACK,
                  width: "100%",
                }}
              >
                {/* Solid icon block */}
                <div
                  style={{
                    position: "relative",
                    width: 46,
                    height: 46,
                    borderRadius: 11,
                    background: tile.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon
                    size={20}
                    color="#FFFFFF"
                    strokeWidth={2.3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  {tile.liveDot && (
                    <span
                      className="insight-live-dot"
                      style={{
                        position: "absolute",
                        top: 5,
                        right: 5,
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#FFFFFF",
                        boxShadow: `0 0 0 2px ${tile.liveDotRingColor ?? tile.iconBg}`,
                      }}
                    />
                  )}
                </div>

                {/* Text block */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1C1C1E",
                      letterSpacing: "-0.2px",
                      lineHeight: 1.2,
                      margin: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {tile.title}
                  </p>

                  {tile.statusText ? (
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: tile.statusColor ?? "#C8384F",
                        letterSpacing: "-0.1px",
                        lineHeight: 1,
                        margin: "2px 0 0",
                      }}
                    >
                      {tile.statusText}
                    </p>
                  ) : (
                    <p
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: "#1C1C1E",
                        letterSpacing: "-0.4px",
                        lineHeight: 1,
                        fontVariantNumeric: "tabular-nums",
                        margin: "2px 0 0",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {tile.metricValue ?? "—"}
                      {tile.metricUnit && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 500,
                            color: "#8E8E93",
                            letterSpacing: "-0.08px",
                            marginLeft: 2,
                          }}
                        >
                          {tile.metricUnit}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
