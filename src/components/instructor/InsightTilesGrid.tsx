import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CalendarPlus, Wrench, Sparkles, UserMinus } from "lucide-react";
import fillGapsIcon from "@/assets/fill-gaps-icon.png";
import vehicleHealthIcon from "@/assets/vehicle-health-icon.png";

interface InsightTile {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  customIcon?: string;
  accent: string;
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
      title: "Fill Gaps",
      subtitle: "Open slots",
      icon: CalendarPlus,
      customIcon: fillGapsIcon,
      accent: "#FF2D55",
      route: "/instructor/gaps",
      badge: gapCount,
    },
    {
      title: "Vehicle Health",
      subtitle: "MOT & service",
      icon: Wrench,
      customIcon: vehicleHealthIcon,
      accent: "#8E8E93",
      route: "/instructor/vehicle-health",
    },
    {
      title: "Smart Nudges",
      subtitle: "Action items",
      icon: Sparkles,
      accent: "#FF9500",
      route: "/instructor/nudges",
    },
    {
      title: "Re-engage",
      subtitle: "Dormant pupils",
      icon: UserMinus,
      accent: "#AF52DE",
      route: "/instructor/dormant-pupils",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {tiles.map((tile, idx) => {
        const Icon = tile.icon;
        return (
          <motion.button
            key={tile.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.04, type: "spring", stiffness: 400, damping: 25 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(tile.route)}
            className="relative h-[110px] p-5 text-left flex flex-col justify-between transition-all duration-200 ease-out"
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              overflow: "hidden",
              border: "0.5px solid rgba(26,111,212,0.1)",
              boxShadow: "0 8px 24px rgba(26,111,212,0.2), 0 2px 6px rgba(0,0,0,0.06)",
            }}
          >
            {/* Badge */}
            {tile.badge && tile.badge > 0 && (
              <div
                className="absolute flex items-center justify-center"
                style={{
                  top: 10,
                  right: 10,
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: "#ff3b30",
                  padding: "0 6px",
                  boxShadow: "0 2px 6px rgba(255,59,48,0.5)",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{tile.badge}</span>
              </div>
            )}
            <div>
              <p className="text-[16px] font-bold leading-tight text-foreground">
                {tile.title}
              </p>
              <p className="text-[13px] mt-0.5 text-muted-foreground">
                {tile.subtitle}
              </p>
            </div>
            <div className="self-end">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#E6E8EC" }}
              >
                {tile.customIcon ? (
                  <img src={tile.customIcon} alt={tile.title} className="w-7 h-7 object-contain" />
                ) : (
                  <Icon size={24} strokeWidth={1.6} style={{ color: tile.accent }} />
                )}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
