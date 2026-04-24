import type { LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

const PALETTE = [
  { accent: "#3B5CCC", iconBg: "#EEF0FF" }, // indigo
  { accent: "#0A84D1", iconBg: "#E5F4FD" }, // blue
  { accent: "#2D8A47", iconBg: "#EEF5EC" }, // green
  { accent: "#C8384F", iconBg: "#FCECEE" }, // red
];

// Stable index per tile title so colors don't shuffle between renders / pages
function colorForTitle(title: string): { accent: string; iconBg: string } {
  const named: Record<string, number> = {
    "Course planner": 0,
    "Agenda": 1,
    "Pupils": 2,
    "Track lesson": 3,
  };
  if (title in named) return PALETTE[named[title]];
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

interface IOSInsightTileProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onClick?: () => void;
  rightSlot?: ReactNode;
  style?: CSSProperties;
}

export function IOSInsightTile({
  icon: Icon,
  title,
  subtitle,
  onClick,
  rightSlot,
  style,
}: IOSInsightTileProps) {
  const { accent, iconBg } = colorForTitle(title);

  return (
    <button
      type="button"
      onClick={onClick}
      className="ios-insight-tile relative flex items-center overflow-hidden text-left"
      style={{
        backgroundColor: "#FFFFFF",
        border: "0.5px solid #E8E8EA",
        borderRadius: 12,
        padding: "10px 11px 10px 14px",
        minHeight: 68,
        gap: 10,
        boxShadow: "none",
        transition: "transform 0.12s cubic-bezier(0.2, 0, 0.2, 1)",
        fontFamily: FONT_STACK,
        ...style,
      }}
    >
      {/* Accent stripe */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 10,
          bottom: 10,
          width: 3,
          borderRadius: 2,
          backgroundColor: accent,
        }}
      />

      {/* Icon badge */}
      <span
        className="flex items-center justify-center shrink-0"
        style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: iconBg }}
      >
        <Icon
          size={15}
          color={accent}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </span>

      {/* Text */}
      <span className="flex flex-col" style={{ minWidth: 0, flex: 1 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#1C1C1E",
            letterSpacing: "-0.2px",
            lineHeight: 1.2,
            margin: "0 0 2px 0",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#8E8E93",
            letterSpacing: "-0.08px",
            lineHeight: 1.25,
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {subtitle}
        </span>
      </span>

      {rightSlot && <span className="shrink-0 ml-1">{rightSlot}</span>}

      <style>{`.ios-insight-tile:active { transform: scale(0.98); }`}</style>
    </button>
  );
}
