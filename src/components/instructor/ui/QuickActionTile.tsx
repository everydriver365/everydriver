import { ComponentType, SVGProps } from "react";
import { haptics } from "@/lib/haptics";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

interface QuickActionTileProps {
  icon: ComponentType<IconProps>;
  iconColor: string;
  iconBackground: string;
  label: string;
  onPress: () => void;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

/**
 * Square tile used inside the Quick Actions bottom sheet.
 * Coloured icon disc on top, single-line label below.
 */
export function QuickActionTile({
  icon: Icon,
  iconColor,
  iconBackground,
  label,
  onPress,
}: QuickActionTileProps) {
  return (
    <button
      type="button"
      onClick={() => {
        haptics.light();
        onPress();
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 8,
        padding: "12px 4px",
        background: "transparent",
        border: "none",
        borderRadius: 12,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        fontFamily: FONT_STACK,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          background: iconBackground,
          color: iconColor,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={26} />
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#1C1C1E",
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: 80,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </button>
  );
}
