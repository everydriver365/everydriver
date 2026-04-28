import { ReactNode, useMemo } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * InstructorTile — unified premium tile for the instructor mobile app.
 *
 * Spec:
 *  - Container: white surface, 0.5px hairline #E5E5EA border, radius 12, padding 16, min-height 110.
 *  - No shadow, no gradient, no coloured backgrounds, no ellipsis truncation.
 *  - Icon block: 40×40, radius 10, pale tinted background (≈10% accent), line icon 22px stroke 2px.
 *  - Title: 15/500 #000, letter-spacing -0.2px. Subtitle: 12/400 #6E6E73.
 *  - Optional counter chip (e.g. "3 new") for stats/messages tiles.
 *  - Category-driven palette — colour is a recognition aid, not decoration.
 *
 * Use only in the instructor mobile app. Do not use in pupil/admin/marketing.
 */

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

// ---- Category palette ------------------------------------------------------

export type TileCategory =
  | "education"
  | "schedule"
  | "people"
  | "location"
  | "settings"
  | "insights"
  | "money";

interface CategoryColor {
  accent: string;
  tint: string;
}

export const TILE_CATEGORY_COLORS: Record<TileCategory, CategoryColor> = {
  education: { accent: "#7C3AED", tint: "rgba(139,92,246,0.18)" },
  schedule:  { accent: "#2563EB", tint: "rgba(59,130,246,0.18)" },
  people:    { accent: "#16A34A", tint: "rgba(34,197,94,0.18)" },
  location:  { accent: "#DC2626", tint: "rgba(239,68,68,0.18)" },
  settings:  { accent: "#4B5563", tint: "rgba(107,114,128,0.18)" },
  insights:  { accent: "#7C3AED", tint: "rgba(139,92,246,0.18)" },
  money:     { accent: "#D97706", tint: "rgba(245,158,11,0.18)" },
};

// ---- Tile ------------------------------------------------------------------

export interface InstructorTileProps {
  icon: LucideIcon;
  title: string;
  /** Plain descriptive text under the title. */
  subtitle?: string;
  /** Optional counter shown as a small chip (e.g. 3, "12 new"). */
  count?: number | string;
  /** Optional unit appended after a numeric count (e.g. "new", "open"). */
  countLabel?: string;
  /** Category for accent + tint. Defaults to "settings". */
  category?: TileCategory;
  /** Subtle pulsing live-status dot on the icon. */
  liveDot?: boolean;
  /** Span the full grid width. */
  fullWidth?: boolean;
  onPress?: () => void;
  ariaLabel?: string;
  className?: string;
}

export function InstructorTile({
  icon: Icon,
  title,
  subtitle,
  count,
  countLabel,
  category = "settings",
  liveDot,
  fullWidth,
  onPress,
  ariaLabel,
  className,
}: InstructorTileProps) {
  const colors = useMemo(() => TILE_CATEGORY_COLORS[category], [category]);

  const showCount =
    count !== undefined && count !== null && count !== "" && count !== 0;

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={ariaLabel ?? title}
      className={`instructor-tile ${className ?? ""}`}
      style={{
        gridColumn: fullWidth ? "1 / span 2" : undefined,
        background: "#F8FAFC",
        border: "none",
        boxShadow:
          "6px 6px 12px rgba(0,0,0,0.06), -6px -6px 12px rgba(255,255,255,0.9)",
        borderRadius: 18,
        padding: 20,
        minHeight: 110,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 12,
        textAlign: "left",
        cursor: onPress ? "pointer" : "default",
        fontFamily: FONT_STACK,
        width: "100%",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 40,
          height: 40,
          borderRadius: 12,
          background: colors.tint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon
          size={22}
          color={colors.accent}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {liveDot && (
          <span
            className="instructor-tile-dot"
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: colors.accent,
              boxShadow: "0 0 0 2px #FFFFFF",
            }}
          />
        )}
        {showCount && (
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              minWidth: 20,
              height: 20,
              padding: "0 6px",
              borderRadius: 10,
              background: colors.accent,
              color: "#FFFFFF",
              fontSize: 11,
              fontWeight: 600,
              lineHeight: "20px",
              textAlign: "center",
              fontVariantNumeric: "tabular-nums",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            {count}
          </span>
        )}
      </div>

      <div style={{ minWidth: 0, width: "100%" }}>
        <p
          style={{
            fontSize: "0.9375em", /* 15px @ default */
            fontWeight: 500,
            color: "#111827",
            letterSpacing: "-0.2px",
            lineHeight: 1.25,
            margin: "0 0 3px",
          }}
        >
          {title}
        </p>
        {(subtitle || (showCount && countLabel)) && (
          <p
            style={{
              fontSize: "0.75em", /* 12px @ default */
              fontWeight: 400,
              color: "#6B7280",
              lineHeight: 1.35,
              margin: 0,
            }}
          >
            {subtitle ?? (countLabel ? `${count} ${countLabel}` : "")}
          </p>
        )}
      </div>
    </button>
  );
}

// ---- Grid ------------------------------------------------------------------

interface InstructorTileGridProps {
  children: ReactNode;
  className?: string;
  /** Apply default section padding. */
  padded?: boolean;
}

export function InstructorTileGrid({
  children,
  className,
  padded = true,
}: InstructorTileGridProps) {
  return (
    <div
      className={className}
      style={{
        padding: padded ? "16px 16px 20px" : undefined,
        fontFamily: FONT_STACK,
      }}
    >
      <style>{`
        @keyframes instructor-tile-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .instructor-tile {
          transition: transform 0.18s cubic-bezier(0.2, 0, 0.2, 1), box-shadow 0.18s cubic-bezier(0.2, 0, 0.2, 1);
        }
        @media (hover: hover) {
          .instructor-tile:hover {
            transform: translateY(-2px);
            box-shadow: 8px 8px 16px rgba(0,0,0,0.08), -8px -8px 16px rgba(255,255,255,1);
          }
        }
        .instructor-tile:active { transform: scale(0.98); }
        .instructor-tile-dot { animation: instructor-tile-pulse 1.6s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .instructor-tile-dot { animation: none; }
          .instructor-tile { transition: none; }
          .instructor-tile:active { transform: none; }
          .instructor-tile:hover { transform: none; }
        }
      `}</style>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 16,
        }}
      >
        {children}
      </div>
    </div>
  );
}
