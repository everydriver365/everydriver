import type { LucideIcon } from "lucide-react";

export interface QuickActionRowProps {
  icon: LucideIcon;
  iconColor: string;
  iconBackground: string;
  label: string;
  onPress: () => void;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

/**
 * Premium-system list row used inside the Quick Actions popup.
 * 36px tinted icon container, line-style icon at 2px stroke, label at 15/500.
 */
export function QuickActionRow({
  icon: Icon,
  iconColor,
  iconBackground,
  label,
  onPress,
}: QuickActionRowProps) {
  return (
    <button
      onClick={onPress}
      style={{
        background: "transparent",
        border: "none",
        padding: "10px 4px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: iconBackground,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon
          size={20}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          color={iconColor}
        />
      </span>
      <span
        style={{
          flex: 1,
          fontFamily: FONT_STACK,
          fontSize: 15,
          fontWeight: 500,
          color: "#000000",
          letterSpacing: -0.2,
        }}
      >
        {label}
      </span>
    </button>
  );
}
