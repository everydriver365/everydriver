import { ReactNode } from "react";

/**
 * Premium-system uppercase eyebrow label used above grouped sections
 * across the instructor mobile app.
 *
 * Spec: 11px / weight 500 / #6E6E73 / uppercase / letter-spacing 0.3px /
 * margin-bottom 12px.
 */
export interface SectionLabelProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function SectionLabel({ children, className, style }: SectionLabelProps) {
  return (
    <div
      className={className}
      style={{
        padding: "0 4px",
        marginBottom: 12,
        ...style,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "#6E6E73",
          letterSpacing: 0.3,
          textTransform: "uppercase",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
        }}
      >
        {children}
      </span>
    </div>
  );
}
