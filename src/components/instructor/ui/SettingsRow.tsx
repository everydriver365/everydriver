import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

/**
 * Single settings list row matching the premium tile design system.
 *
 * Spec:
 *  - Container: white surface, 0.5px hairline #E5E5EA border, radius 12.
 *  - Padding: 14px 16px. Horizontal flex, gap 12, align-items center.
 *  - Optional 32×32 tinted icon block (line icon, 18px, stroke 2px).
 *  - Title 15/500 #000 (-0.2px tracking). Optional subtitle 12/400 #6E6E73.
 *  - Right side: chevron, switch, value text, or custom node.
 *  - Destructive variant uses #C8434F title and a tinted #FBEAEC icon block.
 */

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

export interface SettingsRowProps {
  icon?: LucideIcon;
  iconNode?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  /** Trailing slot — if omitted and onPress is set, a chevron is rendered. */
  trailing?: ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  destructive?: boolean;
  /** Render as part of a single grouped card (no own border). */
  bare?: boolean;
  id?: string;
  className?: string;
  ariaLabel?: string;
}

export function SettingsRow({
  icon: Icon,
  iconNode,
  iconBg = "#F2F2F4",
  iconColor = "#6E6E73",
  title,
  subtitle,
  trailing,
  showChevron,
  onPress,
  destructive,
  bare,
  id,
  className,
  ariaLabel,
}: SettingsRowProps) {
  const titleColor = destructive ? "#C8434F" : "#000000";
  const finalIconBg = destructive ? "#FBEAEC" : iconBg;
  const finalIconColor = destructive ? "#C8434F" : iconColor;

  const content = (
    <>
      {(Icon || iconNode) && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: finalIconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {iconNode ?? (Icon ? <Icon size={18} strokeWidth={2} color={finalIconColor} /> : null)}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: titleColor,
            letterSpacing: -0.2,
            fontFamily: FONT_STACK,
            lineHeight: 1.25,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 12,
              color: "#6E6E73",
              marginTop: 2,
              fontFamily: FONT_STACK,
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {trailing !== undefined ? (
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
          {trailing}
        </div>
      ) : showChevron ? (
        <ChevronRight size={12} strokeWidth={1.6} color="#6E6E73" style={{ flexShrink: 0 }} />
      ) : null}
    </>
  );

  const wrapperStyle: React.CSSProperties = bare
    ? {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        background: "transparent",
        width: "100%",
      }
    : {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        background: "#FFFFFF",
        border: "0.5px solid #E5E5EA",
        borderRadius: 12,
        width: "100%",
      };

  if (onPress) {
    return (
      <button
        id={id}
        type="button"
        onClick={onPress}
        aria-label={ariaLabel ?? title}
        className={className}
        style={wrapperStyle}
      >
        {content}
      </button>
    );
  }

  return (
    <div id={id} className={className} style={wrapperStyle}>
      {content}
    </div>
  );
}
