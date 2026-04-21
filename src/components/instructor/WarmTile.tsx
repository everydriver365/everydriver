import { ReactNode, MouseEvent } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, LucideIcon } from "lucide-react";
import { getEmojiFor } from "./iconEmojiMap";

/**
 * WarmTile — DSM warm-paper feature tile.
 * Single source of truth for the warm/calm tile shell used across the
 * instructor mobile app (dashboard quick actions, secondary menus, etc.).
 *
 * Visual rules (do not deviate):
 *  - White card on #F7F5F0 paper, 0.5px #D3D1C7 border, 12px radius, 14px padding
 *  - 32px neutral icon tile (#F1EFE8), 15px stroke-2 icon
 *  - Categories distinguished by icon stroke colour only (never by bg colour)
 *  - Top-right shows red badge (#A32D2D) when count > 0, else neutral chevron
 *  - Title 13/500 #2C2C2A sentence-case, subtitle 11/400 #888780 sentence-case
 *  - Optional primary accent: 0.5px #F7C1C1 border (ONE per grid max)
 */

export type WarmTileCategory =
  | "schedule" // navy-blue #185FA5  — calendar/agenda/navigation
  | "planning" // deep navy #042C53  — courses/syllabus/learning
  | "people" //   near-black #2C2C2A — pupils/contacts/messages
  | "money" //    navy-blue #185FA5  — payments/earnings/expenses
  | "messages" // near-black #2C2C2A — chats/inbox/notifications
  | "urgent" //   red #A32D2D        — track/SOS/irreversible
  | "neutral"; //  grey #5F5E5A      — settings/utility/admin

/**
 * Stroke colours per category. Light/dark variants are resolved at render
 * time so tiles match the active DSM instructor theme.
 * Light: navy/red/grey. Dark: brighter blue/red/grey for contrast on #162035.
 */
const STROKE_LIGHT: Record<WarmTileCategory, string> = {
  schedule: "#2255FF",
  planning: "#0F1B2D",
  people: "#0F1B2D",
  money: "#2255FF",
  messages: "#0F1B2D",
  urgent: "#E02020",
  neutral: "#7A8FAA",
};
const STROKE_DARK: Record<WarmTileCategory, string> = {
  schedule: "#4D7DFF",
  planning: "#E8F0FF",
  people: "#E8F0FF",
  money: "#4D7DFF",
  messages: "#E8F0FF",
  urgent: "#FF4D4D",
  neutral: "#7A8FAA",
};

// Legacy export kept for any consumers reading raw colour values.
export const WARM_TILE_STROKE: Record<WarmTileCategory, string> = STROKE_LIGHT;

export interface WarmTileProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  category?: WarmTileCategory;
  /** Live badge count. 0 hides badge (chevron shown instead). */
  badgeCount?: number;
  /** Mark this tile as the single primary action in its grid (pink hairline). */
  primary?: boolean;
  /** Hide the right-side chevron entirely (e.g. when an inline action lives there). */
  hideChevron?: boolean;
  /** Replace the chevron/badge with a custom right-side node. */
  rightSlot?: ReactNode;
  to?: string;
  onClick?: (e: MouseEvent) => void;
  className?: string;
  /** Optional override: use a custom node inside the icon square (e.g. img). */
  iconSlot?: ReactNode;
  /** Optional override: tinted background colour for the icon square. */
  iconBg?: string;
  /** Optional override: explicit icon colour (used as fill + stroke for SF-style filled icons). */
  iconColor?: string;
  /** Render the icon filled SF-style (fill = iconColor). Defaults to true when iconColor is supplied. */
  iconFilled?: boolean;
}

export function WarmTile({
  icon: Icon,
  title,
  subtitle,
  category = "neutral",
  badgeCount,
  primary = false,
  hideChevron = false,
  rightSlot,
  to,
  onClick,
  className,
  iconSlot,
  iconBg,
  iconColor,
  iconFilled,
}: WarmTileProps) {
  const showBadge = typeof badgeCount === "number" && badgeCount > 0;
  const useFilled = iconFilled ?? !!iconColor;

  const inner = (
    <div
      className={className ?? ""}
      style={{
        position: "relative",
        background: "hsl(var(--dsm-card))",
        border: primary ? `0.5px solid hsl(var(--dsm-accent-red) / 0.4)` : "none",
        borderRadius: 12,
        padding: 14,
        cursor: to || onClick ? "pointer" : undefined,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      data-category={category}
    >
      {/* Top row: icon + chevron/badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: iconBg ?? "hsl(var(--dsm-tile-icon-bg))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {iconSlot ?? (() => {
            const iconName = (Icon as { displayName?: string; name?: string }).displayName
              ?? (Icon as { name?: string }).name
              ?? "";
            const emoji = getEmojiFor(iconName);
            if (emoji) {
              return (
                <span
                  role="img"
                  aria-label={iconName}
                  style={{
                    fontFamily: `"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`,
                    fontSize: 20,
                    lineHeight: 1,
                  }}
                >
                  {emoji}
                </span>
              );
            }
            return (
              <Icon
                size={18}
                strokeWidth={useFilled ? 1.4 : 1.6}
                className={iconColor ? undefined : `dsm-tile-icon dsm-tile-icon-${category}`}
                color={iconColor}
                fill={useFilled ? iconColor ?? "currentColor" : "none"}
                style={{ strokeLinecap: "round", strokeLinejoin: "round" }}
              />
            );
          })()}
        </div>
        {rightSlot
          ? rightSlot
          : showBadge
          ? (
            <span
              style={{
                background: "hsl(var(--dsm-accent-red))",
                color: "#FFFFFF",
                fontSize: 10,
                fontWeight: 500,
                padding: "1px 6px",
                borderRadius: 999,
                lineHeight: 1.4,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )
          : !hideChevron
          ? <ChevronRight size={12} strokeWidth={1.6} color="hsl(var(--dsm-text-secondary))" />
          : null}
      </div>

      {/* Bottom row: title + subtitle */}
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "hsl(var(--dsm-text))",
            lineHeight: 1.25,
            fontFamily: "Inter, sans-serif",
            margin: 0,
          }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            style={{
              fontSize: 11,
              fontWeight: 400,
              color: "hsl(var(--dsm-text-secondary))",
              marginTop: 2,
              fontFamily: "Inter, sans-serif",
              margin: "2px 0 0 0",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} style={{ display: "block", height: "100%" }}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          display: "block",
          textAlign: "left",
          height: "100%",
          padding: 0,
          background: "transparent",
          border: "none",
          width: "100%",
        }}
      >
        {inner}
      </button>
    );
  }
  return inner;
}

/**
 * WarmTileGrid — 2-col grid container that sits directly on the warm paper.
 * 8px gap, 16px horizontal padding. Use for every tile group.
 */
export function WarmTileGrid({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div className={className} style={{ padding: "0 16px" }}>
      {label && (
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "hsl(var(--dsm-text-secondary))",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            margin: "0 0 12px 0",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {label}
        </p>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 8,
        }}
      >
        {children}
      </div>
    </div>
  );
}
