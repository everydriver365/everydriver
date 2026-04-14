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
    <div className="grid grid-cols-2 gap-3">
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
            className="relative text-left flex flex-col justify-between"
            style={{
              height: 110,
              padding: 20,
              backgroundColor: "#FFFFFF",
              borderRadius: 22,
              border: "1px solid #DAE4E1",
              boxShadow: "0 2px 12px rgba(15, 70, 60, 0.06), 0 1px 4px rgba(15, 70, 60, 0.03)",
            }}
          >
            {/* Badge */}
            {tile.badge && tile.badge > 0 && (
              <div
                className="absolute top-3.5 right-3.5 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#E45A3B" }}
              >
                <span className="text-[11px] font-bold text-white">{tile.badge}</span>
              </div>
            )}
            <div>
              <p className="text-[16px] font-bold leading-tight" style={{ color: "#12263A" }}>
                {tile.title}
              </p>
              <p className="text-[13px] mt-0.5" style={{ color: "#6A7A78" }}>
                {tile.subtitle}
              </p>
            </div>
            <div className="self-end">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(15, 118, 110, 0.08)" }}
              >
                {tile.customIcon ? (
                  <img src={tile.customIcon} alt={tile.title} className="w-6 h-6 object-contain" />
                ) : (
                  <Icon size={22} strokeWidth={1.6} style={{ color: "#0F766E" }} />
                )}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
