import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CalendarPlus, Car, Sparkles, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface InsightTile {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
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
      iconColor: "#059669",
      iconBg: "#ECFDF5",
      route: "/instructor/gaps",
      badge: gapCount,
    },
    {
      title: "Vehicle Health",
      subtitle: "MOT & service",
      icon: Car,
      iconColor: "#5B21B6",
      iconBg: "#EDE9FE",
      route: "/instructor/vehicle-health",
    },
    {
      title: "Smart Nudges",
      subtitle: "Action items",
      icon: Sparkles,
      iconColor: "#92400E",
      iconBg: "#FEF3C7",
      route: "/instructor/nudges",
    },
    {
      title: "Re-engage",
      subtitle: "Dormant pupils",
      icon: UserCheck,
      iconColor: "#4F46E5",
      iconBg: "#EEF2FF",
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
            style={{
              position: "relative",
              background: "white",
              borderRadius: 14,
              overflow: "hidden",
              border: "0.5px solid #E4E4E7",
              padding: "16px 14px 14px",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: 110,
            }}
          >
            {tile.badge && tile.badge > 0 && (
              <span
                className="flex items-center justify-center"
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: "#ff3b30",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "0 6px",
                  lineHeight: 1,
                  boxShadow: "0 2px 6px rgba(255,59,48,0.5)",
                }}
              >
                {tile.badge > 99 ? "99+" : tile.badge}
              </span>
            )}
            <div>
              <p style={{ fontSize: 15, fontWeight: 500, color: "#18181B", marginBottom: 2, lineHeight: 1.2 }}>
                {tile.title}
              </p>
              <p style={{ fontSize: 12, fontWeight: 400, color: "#71717A" }}>
                {tile.subtitle}
              </p>
            </div>
            <div className="flex items-end justify-between" style={{ marginTop: "auto" }}>
              <div style={{ flex: 1 }} />
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: tile.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={22} strokeWidth={2} color={tile.iconColor} />
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
