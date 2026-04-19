import { ReactNode, MouseEvent } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, LucideIcon } from "lucide-react";

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

export const WARM_TILE_STROKE: Record<WarmTileCategory, string> = {
  schedule: "#185FA5",
  planning: "#042C53",
  people: "#2C2C2A",
  money: "#185FA5",
  messages: "#2C2C2A",
  urgent: "#A32D2D",
  neutral: "#5F5E5A",
};

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
}: WarmTileProps) {
  const stroke = WARM_TILE_STROKE[category];
  const showBadge = typeof badgeCount === "number" && badgeCount > 0;

  const inner = (
    <div
      className={className}
      style={{
        position: "relative",
        background: "#FFFFFF",
        border: `0.5px solid ${primary ? "#F7C1C1" : "#D3D1C7"}`,
        borderRadius: 12,
        padding: 14,
        cursor: to || onClick ? "pointer" : undefined,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
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
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#F1EFE8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {iconSlot ?? (
            <Icon
              size={15}
              strokeWidth={2}
              color={stroke}
              style={{ strokeLinecap: "round", strokeLinejoin: "round" }}
            />
          )}
        </div>
        {rightSlot
          ? rightSlot
          : showBadge
          ? (
            <span
              style={{
                background: "#A32D2D",
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
          ? <ChevronRight size={12} strokeWidth={2} color="#888780" />
          : null}
      </div>

      {/* Bottom row: title + subtitle */}
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#2C2C2A",
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
              color: "#888780",
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
            color: "#888780",
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
