import { useNavigate } from "react-router-dom";
import { CalendarPlus, Car, Sparkles, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface InsightTile {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  route: string;
  badge?: number;
  accent: string;
  iconBg: string;
}

interface InsightTilesGridProps {
  gapCount?: number;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

export function InsightTilesGrid({ gapCount = 0 }: InsightTilesGridProps) {
  const navigate = useNavigate();

  const tiles: InsightTile[] = [
    {
      title: "Fill gaps",
      subtitle: "Open slots",
      icon: CalendarPlus,
      route: "/instructor/gaps",
      badge: gapCount,
      accent: "#3B5CCC",
      iconBg: "#EEF0FF",
    },
    {
      title: "Vehicle health",
      subtitle: "MOT & service",
      icon: Car,
      route: "/instructor/vehicle-health",
      accent: "#0A84D1",
      iconBg: "#E5F4FD",
    },
    {
      title: "Smart nudges",
      subtitle: "Action items",
      icon: Sparkles,
      route: "/instructor/nudges",
      accent: "#2D8A47",
      iconBg: "#EEF5EC",
    },
    {
      title: "Re-engage",
      subtitle: "Dormant pupils",
      icon: UserCheck,
      route: "/instructor/dormant-pupils",
      accent: "#C8384F",
      iconBg: "#FCECEE",
    },
  ];

  return (
    <div
      className="grid grid-cols-2 px-4"
      style={{ gap: "8px", fontFamily: FONT_STACK, backgroundColor: "#FFFFFF" }}
    >
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <button
            key={tile.title}
            type="button"
            onClick={() => navigate(tile.route)}
            className="insight-tile relative flex items-center overflow-hidden text-left"
            style={{
              backgroundColor: "#FFFFFF",
              border: "0.5px solid #E8E8EA",
              borderRadius: 12,
              padding: "10px 11px 10px 14px",
              minHeight: 68,
              gap: 10,
              boxShadow: "none",
              transition: "transform 0.12s cubic-bezier(0.2, 0, 0.2, 1)",
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
                backgroundColor: tile.accent,
              }}
            />

            {/* Icon badge */}
            <span
              className="flex items-center justify-center shrink-0"
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                backgroundColor: tile.iconBg,
              }}
            >
              <Icon
                size={15}
                color={tile.accent}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </span>

            {/* Text block */}
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
                {tile.title}
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
                {tile.subtitle}
              </span>
            </span>
          </button>
        );
      })}

      <style>{`
        .insight-tile:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
}
