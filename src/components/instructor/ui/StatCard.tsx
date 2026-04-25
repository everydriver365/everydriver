import { ReactNode } from "react";

/**
 * Premium tile-system stat card. Small white card with hairline border,
 * a coloured status dot, big number and a muted label.
 */
export interface StatCardProps {
  /** Coloured 6×6 indicator dot. */
  dot?: string;
  /** Optional icon shown in lieu of the dot (kept for forward use). */
  icon?: ReactNode;
  value: ReactNode;
  label: ReactNode;
  className?: string;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

export function StatCard({ dot, icon, value, label, className }: StatCardProps) {
  return (
    <div
      className={className}
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #E5E5EA",
        borderRadius: 12,
        padding: "10px 8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        fontFamily: FONT_STACK,
        minWidth: 0,
      }}
    >
      {icon ? (
        icon
      ) : dot ? (
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: dot,
          }}
        />
      ) : null}
      <span
        style={{
          fontSize: 18,
          fontWeight: 500,
          color: "#000000",
          letterSpacing: "-0.3px",
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 400,
          color: "#6E6E73",
        }}
      >
        {label}
      </span>
    </div>
  );
}
