import { ReactNode, useMemo } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Tile — canonical iOS-style instructor app tile.
 *
 * Single source of truth for all dashboard / insight / navigation tiles
 * across the instructor mobile app. Visual-only refresh; functionality
 * (routes, click handlers, icon identities, ordering) lives at the call site.
 *
 * Use <TileGrid> as the parent for proper 2-column layout, gap, and odd-tile
 * full-width behaviour.
 */

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

// ---- Palette ---------------------------------------------------------------

export const TILE_COLORS = {
  indigo: "#3B5CCC",
  blue: "#0A84D1",
  green: "#2D8A47",
  red: "#C8384F",
  purple: "#7B4DD4",
  orange: "#D97523",
  teal: "#0F9B93",
  slate: "#4A5568",
} as const;

export type TileColorName = keyof typeof TILE_COLORS;

/** Deterministic hash so the same tile id always picks the same colour. */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const CYCLE_COLORS: TileColorName[] = [
  "indigo",
  "blue",
  "green",
  "purple",
  "orange",
  "teal",
];

/**
 * Identity-based colour map. The same tile keeps the same colour everywhere.
 * Reserve red for live/action state; slate for utility/settings.
 * Anything unmapped falls back to a deterministic cycle hash.
 */
export const TILE_IDENTITY_COLORS: Record<string, TileColorName> = {
  // Reserved
  "track-lesson": "red",
  "start-recording": "red",
  "end-session": "red",
  "live-session": "red",
  "settings": "slate",
  "profile": "slate",
  "menu": "slate",

  // Insights
  "fill-gaps": "indigo",
  "agenda": "blue",
  "course-planner": "indigo",
  "pupils": "green",
  "vehicle-health": "blue",
  "smart-nudges": "purple",
  "re-engage": "purple",

  // Activity
  "job-offers": "red",
  "messages": "blue",
  "tests": "green",
};

export function getTileColor(id: string, override?: TileColorName): string {
  if (override) return TILE_COLORS[override];
  const mapped = TILE_IDENTITY_COLORS[id];
  if (mapped) return TILE_COLORS[mapped];
  const idx = hashString(id) % CYCLE_COLORS.length;
  return TILE_COLORS[CYCLE_COLORS[idx]];
}

// ---- Grid ------------------------------------------------------------------

interface TileGridProps {
  children: ReactNode;
  className?: string;
  /** Apply outer section padding (18px 14px 20px). Defaults true. */
  padded?: boolean;
}

export function TileGrid({ children, className, padded = true }: TileGridProps) {
  return (
    <div
      className={className}
      style={{
        padding: padded ? "18px 14px 20px" : undefined,
        background: "#F2F2F7",
        fontFamily: FONT_STACK,
      }}
    >
      <style>{`
        @keyframes tile-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .tile-press {
          transition: transform 0.12s cubic-bezier(0.2, 0, 0.2, 1);
        }
        .tile-press:active { transform: scale(0.97); }
        .tile-live-dot { animation: tile-pulse 1.6s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .tile-live-dot { animation: none; }
          .tile-press { transition: none; }
          .tile-press:active { transform: none; }
        }
      `}</style>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 9,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ---- Tile ------------------------------------------------------------------

interface TileProps {
  /** Stable identity for colour mapping (e.g. "fill-gaps"). */
  id: string;
  title: string;
  icon: LucideIcon;
  onClick?: () => void;

  /** Override colour assignment. */
  color?: TileColorName;

  /** Numeric/short metric (e.g. 3, "2h"). Renders metric line. */
  metricValue?: string | number;
  /** Optional unit shown trailing the metric (e.g. "open"). */
  metricUnit?: string;

  /** Action-oriented status text (e.g. "Tap to start"). Used when no metric. */
  statusText?: string;

  /** Navigational subtitle (e.g. "Notifications, privacy"). Used when no metric and no status. */
  subtitle?: string;

  /** Show pulsing live dot on the icon block. */
  liveDot?: boolean;

  /** Span both columns (use for solo tiles or odd last tile). */
  fullWidth?: boolean;

  ariaLabel?: string;
}

export function Tile({
  id,
  title,
  icon: Icon,
  onClick,
  color,
  metricValue,
  metricUnit,
  statusText,
  subtitle,
  liveDot,
  fullWidth,
  ariaLabel,
}: TileProps) {
  const iconBg = useMemo(() => getTileColor(id, color), [id, color]);

  // Determine which secondary line to render (deterministic, exactly one).
  const secondary: "metric" | "status" | "subtitle" | "none" =
    metricValue !== undefined && metricValue !== null && metricValue !== ""
      ? "metric"
      : statusText
      ? "status"
      : subtitle
      ? "subtitle"
      : "none";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? title}
      className="tile-press"
      style={{
        gridColumn: fullWidth ? "1 / span 2" : undefined,
        background: "#FFFFFF",
        border: "none",
        boxShadow: "none",
        borderRadius: 14,
        padding: 12,
        minHeight: 96,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
        fontFamily: FONT_STACK,
        width: "100%",
      }}
    >
      {/* Solid icon block */}
      <div
        style={{
          position: "relative",
          width: 48,
          height: 48,
          borderRadius: 12,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon
          size={22}
          color="#FFFFFF"
          strokeWidth={2.3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {liveDot && (
          <span
            className="tile-live-dot"
            style={{
              position: "absolute",
              top: 5,
              right: 5,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#FFFFFF",
              boxShadow: `0 0 0 2px ${iconBg}`,
            }}
          />
        )}
      </div>

      {/* Text block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#1C1C1E",
            letterSpacing: "-0.2px",
            lineHeight: 1.25,
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </p>

        {secondary === "metric" && (
          <p
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#1C1C1E",
              letterSpacing: "-0.4px",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              margin: "4px 0 0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {metricValue}
            {metricUnit && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: "#8E8E93",
                  letterSpacing: "-0.08px",
                  marginLeft: 3,
                }}
              >
                {metricUnit}
              </span>
            )}
          </p>
        )}

        {secondary === "status" && (
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: iconBg,
              letterSpacing: "-0.1px",
              lineHeight: 1,
              margin: "4px 0 0",
            }}
          >
            {statusText}
          </p>
        )}

        {secondary === "subtitle" && (
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#8E8E93",
              letterSpacing: "-0.08px",
              lineHeight: 1.25,
              margin: "3px 0 0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </button>
  );
}
