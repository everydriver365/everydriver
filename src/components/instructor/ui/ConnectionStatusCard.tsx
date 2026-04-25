import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Premium tile-system connection status card.
 *
 * Used on the Tracking screen for the GPS / RADIUS device connection.
 * State drives the icon tint, status-dot colour, and (optionally) the icon itself.
 *
 * Visual spec — see prompt: 40×40 tinted icon, 10×10 status dot overlay
 * with 2px white border, 15/500 title, 11px uppercase eyebrow + 3px bullet
 * + 12px detail line.
 */

export type ConnectionState = "connected" | "disconnected" | "error";

const STATE_COLORS: Record<ConnectionState, { bg: string; icon: string; dot: string }> = {
  connected:    { bg: "#E8F3E8", icon: "#3B8B3B", dot: "#3B8B3B" },
  disconnected: { bg: "#F2F2F4", icon: "#6E6E73", dot: "#6E6E73" },
  error:        { bg: "#FBEAEC", icon: "#C8434F", dot: "#C8434F" },
};

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

export interface ConnectionStatusCardProps {
  icon: LucideIcon;
  state: ConnectionState;
  title: string;
  /** Uppercase device label (e.g. "RADIUS"). */
  deviceLabel?: string | null;
  /** Driver / vehicle name shown after the bullet. */
  detail?: string | null;
  /** Optional trailing slot — usually a small action button. */
  trailing?: ReactNode;
  className?: string;
}

export function ConnectionStatusCard({
  icon: Icon,
  state,
  title,
  deviceLabel,
  detail,
  trailing,
  className,
}: ConnectionStatusCardProps) {
  const palette = STATE_COLORS[state];

  return (
    <div
      className={className}
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #E5E5EA",
        borderRadius: 12,
        padding: 14,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: palette.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={22} strokeWidth={2} color={palette.icon} />
        </div>
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: palette.dot,
            border: "2px solid #FFFFFF",
          }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: "#000000",
            letterSpacing: -0.2,
            fontFamily: FONT_STACK,
            lineHeight: 1.25,
          }}
        >
          {title}
        </div>
        {(deviceLabel || detail) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 3,
              minWidth: 0,
            }}
          >
            {deviceLabel && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#6E6E73",
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                  fontFamily: FONT_STACK,
                  flexShrink: 0,
                }}
              >
                {deviceLabel}
              </span>
            )}
            {deviceLabel && detail && (
              <span
                aria-hidden
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: "#6E6E73",
                  flexShrink: 0,
                }}
              />
            )}
            {detail && (
              <span
                style={{
                  fontSize: 12,
                  color: "#6E6E73",
                  fontFamily: FONT_STACK,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
              >
                {detail}
              </span>
            )}
          </div>
        )}
      </div>

      {trailing && (
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
          {trailing}
        </div>
      )}
    </div>
  );
}
