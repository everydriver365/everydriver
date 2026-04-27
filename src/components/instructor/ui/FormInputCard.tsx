import { ReactNode, forwardRef } from "react";

export interface FormInputCardProps {
  icon?: ReactNode;
  /** Small label shown above the card (e.g. "From", "Earliest") */
  topLabel?: string;
  value?: string | null;
  placeholder?: string;
  trailing?: ReactNode;
  onClick?: () => void;
  invalid?: boolean;
  /** Render as a div instead of a button (used when wrapping native inputs) */
  asDiv?: boolean;
  children?: ReactNode;
  className?: string;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

/**
 * Premium tile-system tappable input card.
 * White surface, 0.5px hairline border, 10px radius, 12/14 padding.
 * Used for date, time, and picker-style fields across instructor forms.
 */
export const FormInputCard = forwardRef<HTMLButtonElement, FormInputCardProps>(
  function FormInputCard(
    {
      icon,
      topLabel,
      value,
      placeholder,
      trailing,
      onClick,
      invalid,
      asDiv,
      children,
      className,
    },
    ref,
  ) {
    const hasValue = value != null && value !== "";
    const cardStyle: React.CSSProperties = {
      background: "#FFFFFF",
      border: `0.5px solid ${invalid ? "#C8434F" : "#E5E5EA"}`,
      borderRadius: 10,
      padding: "12px 14px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      cursor: onClick ? "pointer" : "default",
      textAlign: "left",
      fontFamily: FONT_STACK,
      WebkitTapHighlightColor: "transparent",
    };

    const inner = (
      <>
        {icon && <span style={{ flexShrink: 0, color: "#6E6E73", display: "inline-flex" }}>{icon}</span>}
        <span style={{ flex: 1, minWidth: 0, display: "block" }}>
          {children ?? (
            <span
              style={{
                fontSize: 15,
                fontWeight: hasValue ? 500 : 400,
                color: hasValue ? "#000000" : "#6E6E73",
                letterSpacing: hasValue ? -0.2 : 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "block",
              }}
            >
              {hasValue ? value : placeholder}
            </span>
          )}
        </span>
        {trailing && <span style={{ flexShrink: 0, color: "#6E6E73", display: "inline-flex" }}>{trailing}</span>}
      </>
    );

    return (
      <div className={className} style={{ display: "block" }}>
        {topLabel && (
          <div
            style={{
              fontSize: 11,
              color: "#6E6E73",
              margin: "0 0 4px",
              paddingLeft: 2,
              fontFamily: FONT_STACK,
            }}
          >
            {topLabel}
          </div>
        )}
        {asDiv ? (
          <div style={cardStyle} onClick={onClick}>
            {inner}
          </div>
        ) : (
          <button ref={ref} type="button" onClick={onClick} style={{ ...cardStyle, border: cardStyle.border }}>
            {inner}
          </button>
        )}
      </div>
    );
  },
);
