import { ReactNode, MouseEvent } from "react";
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { InstructorTile, type TileCategory } from "./InstructorTile";

/**
 * WarmTile — compatibility shim.
 *
 * Previously a bespoke "warm paper" tile. Now delegates to the unified
 * <InstructorTile> so every callsite inherits the premium spec automatically.
 * Kept as a named export to avoid touching dozens of callsites.
 */

export type WarmTileCategory =
  | "schedule"
  | "planning"
  | "people"
  | "money"
  | "messages"
  | "urgent"
  | "neutral";

const CATEGORY_MAP: Record<WarmTileCategory, TileCategory> = {
  schedule: "schedule",
  planning: "education",
  people: "people",
  money: "money",
  messages: "people",
  urgent: "location", // red accent
  neutral: "settings",
};

// Legacy export retained for any consumers reading raw colour values.
export const WARM_TILE_STROKE: Record<WarmTileCategory, string> = {
  schedule: "#2B7BC8",
  planning: "#5B6BC9",
  people: "#3B8B3B",
  money: "#B8801F",
  messages: "#3B8B3B",
  urgent: "#C8434F",
  neutral: "#6E6E73",
};

export interface WarmTileProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  category?: WarmTileCategory;
  badgeCount?: number;
  primary?: boolean;
  hideChevron?: boolean;
  rightSlot?: ReactNode;
  to?: string;
  onClick?: (e: MouseEvent) => void;
  className?: string;
  iconSlot?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  iconFilled?: boolean;
}

export function WarmTile({
  icon,
  title,
  subtitle,
  category = "neutral",
  badgeCount,
  to,
  onClick,
  className,
}: WarmTileProps) {
  const tile = (
    <InstructorTile
      icon={icon}
      title={title}
      subtitle={subtitle}
      category={CATEGORY_MAP[category]}
      count={typeof badgeCount === "number" && badgeCount > 0 ? badgeCount : undefined}
      onPress={onClick ? () => onClick({} as MouseEvent) : undefined}
      className={className}
    />
  );

  if (to) {
    return (
      <Link to={to} style={{ display: "block", height: "100%" }}>
        {tile}
      </Link>
    );
  }
  return tile;
}

/**
 * WarmTileGrid — kept signature, now produces the unified 12px gap layout
 * with the page background untouched (consumers control padding).
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
            color: "#6E6E73",
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
          gap: 12,
        }}
      >
        {children}
      </div>
    </div>
  );
}
