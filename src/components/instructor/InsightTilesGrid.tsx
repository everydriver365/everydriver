import { useNavigate } from "react-router-dom";
import { CalendarPlus, Car, Sparkles, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { WarmTile, WarmTileGrid, WarmTileCategory } from "./WarmTile";

interface InsightTile {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  category: WarmTileCategory;
  route: string;
  badge?: number;
}

interface InsightTilesGridProps {
  gapCount?: number;
}

export function InsightTilesGrid({ gapCount = 0 }: InsightTilesGridProps) {
  const navigate = useNavigate();

  const tiles: InsightTile[] = [
    {
      title: "Fill gaps",
      subtitle: "Open slots",
      icon: CalendarPlus,
      category: "schedule",
      route: "/instructor/gaps",
      badge: gapCount,
    },
    {
      title: "Vehicle health",
      subtitle: "MOT & service",
      icon: Car,
      category: "neutral",
      route: "/instructor/vehicle-health",
    },
    {
      title: "Smart nudges",
      subtitle: "Action items",
      icon: Sparkles,
      category: "planning",
      route: "/instructor/nudges",
    },
    {
      title: "Re-engage",
      subtitle: "Dormant pupils",
      icon: UserCheck,
      category: "people",
      route: "/instructor/dormant-pupils",
    },
  ];

  return (
    <WarmTileGrid>
      {tiles.map((tile) => (
        <WarmTile
          key={tile.title}
          icon={tile.icon}
          title={tile.title}
          subtitle={tile.subtitle}
          category={tile.category}
          badgeCount={tile.badge}
          onClick={() => navigate(tile.route)}
        />
      ))}
    </WarmTileGrid>
  );
}
