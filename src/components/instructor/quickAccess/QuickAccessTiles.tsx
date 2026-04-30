import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { TILE_TONE, TileTone } from "./tileRegistry";

interface RichTileCardProps {
  icon: LucideIcon;
  tone: TileTone;
  title: string;
  subtitle?: string;
  badge?: { label: string; tone?: TileTone };
  onPress: () => void;
  locked?: boolean;
  ariaLabel?: string;
}

/**
 * Rich tile card used in the "Frequently used" 2-column grid.
 * 36px tinted icon container, title + meaningful subtitle/badge.
 */
export function RichTileCard({
  icon: Icon,
  tone,
  title,
  subtitle,
  badge,
  onPress,
  locked,
  ariaLabel,
}: RichTileCardProps) {
  const palette = TILE_TONE[tone];
  const badgePalette = badge?.tone ? TILE_TONE[badge.tone] : palette;

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={ariaLabel ?? title}
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #E5E5EA",
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
        width: "100%",
        cursor: "pointer",
        opacity: locked ? 0.55 : 1,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: palette.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} strokeWidth={1.8} color={palette.fg} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#000000",
              letterSpacing: "-0.1px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </span>
          {badge && (
            <span
              style={{
                background: badgePalette.bg,
                color: badgePalette.fg,
                borderRadius: 999,
                padding: "1px 6px",
                fontSize: 10,
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              {badge.label}
            </span>
          )}
        </div>
        {subtitle && (
          <p
            style={{
              fontSize: 11,
              color: "#6E6E73",
              margin: "1px 0 0",
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

interface CompactTileProps {
  icon: LucideIcon;
  tone: TileTone;
  label: string;
  alertCount?: number;
  onPress: () => void;
  locked?: boolean;
  rightAccessory?: ReactNode;
}

/**
 * Compact app-grid tile (4-column grid). Label-only, optional red alert
 * badge floating on the icon container.
 */
export function CompactTile({
  icon: Icon,
  tone,
  label,
  alertCount,
  onPress,
  locked,
  rightAccessory,
}: CompactTileProps) {
  const palette = TILE_TONE[tone];
  const showBadge = typeof alertCount === "number" && alertCount > 0;

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={label}
      style={{
        background: "transparent",
        border: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        position: "relative",
        cursor: "pointer",
        opacity: locked ? 0.55 : 1,
      }}
    >
      <div style={{ position: "relative" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 11,
            background: palette.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} strokeWidth={1.8} color={palette.fg} />
        </div>
        {showBadge && (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              background: "#C8434F",
              color: "#FFFFFF",
              fontSize: 9,
              fontWeight: 500,
              padding: "1px 5px",
              borderRadius: 999,
              minWidth: 16,
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {alertCount! > 99 ? "99+" : alertCount}
          </span>
        )}
        {rightAccessory && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
            }}
          >
            {rightAccessory}
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: 10,
          color: "#000000",
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: 64,
        }}
      >
        {label}
      </span>
    </button>
  );
}

interface PersistentSearchBarProps {
  value: string;
  onChange: (v: string) => void;
  totalToolCount: number;
}

export function PersistentSearchBar({
  value,
  onChange,
  totalToolCount,
}: PersistentSearchBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "#FFFFFF",
        border: "0.5px solid #E5E5EA",
        borderRadius: 10,
        padding: "9px 12px",
        marginBottom: 16,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6E6E73" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.3-4.3"></path>
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Search ${totalToolCount} tools`}
        aria-label={`Search ${totalToolCount} tools`}
        style={{
          flex: 1,
          minWidth: 0,
          border: 0,
          outline: "none",
          background: "transparent",
          fontSize: 13,
          color: "#000000",
          padding: 0,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          style={{
            background: "transparent",
            border: 0,
            padding: 0,
            color: "#6E6E73",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="m15 9-6 6M9 9l6 6"></path>
          </svg>
        </button>
      )}
    </div>
  );
}
