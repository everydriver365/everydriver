import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

/**
 * Shared menu row used across the instructor side menu / settings list.
 *
 * Spec: full-width row with a 32px tinted icon container (1.8px stroke icon),
 * 14px/500 sentence-case label, optional notification badge, optional right
 * slot (chevron, lock badge, etc.), and an active state that flips the row
 * to a calm blue tint (no heavy fills, no shadows).
 */
export interface MenuRowProps {
  icon?: LucideIcon;
  iconSrc?: string;
  iconColor: string;
  iconBackground: string;
  label: string;
  badgeCount?: number;
  isActive?: boolean;
  destructive?: boolean;
  onPress?: () => void;
  rightSlot?: ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
}

const fontFamily =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

// Aligned with unified --portal-accent token (#2B7BC8) and danger.
const ACTIVE_BG = "var(--portal-accent-soft, #E6F1FB)";
const ACTIVE_FG = "var(--portal-accent, #2B7BC8)";
const DESTRUCTIVE_FG = "var(--portal-danger, #C8434F)";

export function MenuRow({
  icon: Icon,
  iconSrc,
  iconColor,
  iconBackground,
  label,
  badgeCount,
  isActive = false,
  destructive = false,
  onPress,
  rightSlot,
  disabled = false,
  ariaLabel,
}: MenuRowProps) {
  // Active state flips the row tint and recolours icon container + label/icon.
  const rowBg = isActive ? ACTIVE_BG : "transparent";
  const labelColor = destructive
    ? DESTRUCTIVE_FG
    : isActive
      ? ACTIVE_FG
      : "var(--portal-text, #000000)";
  const resolvedIconBg = isActive ? "#FFFFFF" : iconBackground;
  const resolvedIconColor = isActive ? ACTIVE_FG : iconColor;

  const showBadge = typeof badgeCount === "number" && badgeCount > 0;
  const badgeText = badgeCount && badgeCount > 9 ? "9+" : String(badgeCount ?? "");

  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      style={{
        background: rowBg,
        border: "none",
        padding: "8px 4px",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: disabled ? "default" : "pointer",
        textAlign: "left",
        width: "100%",
        opacity: disabled ? 0.6 : 1,
        fontFamily,
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: resolvedIconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {iconSrc ? (
          <img src={iconSrc} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
        ) : Icon ? (
          <Icon
            size={18}
            strokeWidth={1.8}
            color={resolvedIconColor}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </span>

      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 14,
          fontWeight: 500,
          color: labelColor,
          letterSpacing: "-0.2px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>

      {showBadge && (
        <span
          style={{
            marginLeft: "auto",
            minWidth: 18,
            height: 16,
            padding: "0 5px",
            borderRadius: 999,
            background: "#C8434F",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: "#FFFFFF",
              lineHeight: 1,
            }}
          >
            {badgeText}
          </span>
        </span>
      )}

      {rightSlot && (
        <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{rightSlot}</span>
      )}
    </button>
  );
}
