import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CalendarPlus, Car, Sparkles, UserCheck, ChevronRight } from "lucide-react";
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
      iconColor: "#2A394F",
      iconBg: "#E8ECF1",
      route: "/instructor/dormant-pupils",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-[10px]">
      {tiles.map((tile, idx) => {
        const Icon = tile.icon;
        return (
          <motion.button
            key={tile.title}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.04, type: "spring", stiffness: 400, damping: 25 }}
            whileTap={{ scale: 0.98, backgroundColor: "#F4F4F5" }}
            whileHover={{ backgroundColor: "#FAFAFA" }}
            onClick={() => navigate(tile.route)}
            className="focus-visible:ring-2 focus-visible:ring-[#2A394F] outline-none"
            style={{
              position: "relative",
              background: "#FFFFFF",
              borderRadius: 14,
              boxShadow: "0 12px 28px rgba(20, 30, 60, 0.14), 0 4px 8px rgba(20, 30, 60, 0.06)",
              padding: "14px",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              cursor: "pointer",
              overflow: "hidden",
              transition: "background 120ms ease",
            }}
          >
            {/* Blue gradient accent line at bottom */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 2,
                background: "linear-gradient(90deg, #2A394F, #3D5377)",
                borderRadius: "0 0 14px 14px",
              }}
            />

            {/* Icon tile + badge row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: tile.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={22} strokeWidth={2} color={tile.iconColor} />
              </div>
              {tile.badge && tile.badge > 0 ? (
                <span
                  className="flex items-center justify-center"
                  style={{
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: "#FEF2F2",
                    color: "#DC2626",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "0 6px",
                    lineHeight: 1,
                  }}
                >
                  {tile.badge > 99 ? "99+" : tile.badge}
                </span>
              ) : (
                <ChevronRight size={16} strokeWidth={2} color="#A1A1AA" style={{ marginTop: 2 }} />
              )}
            </div>

            {/* Text */}
            <div>
              <p style={{ fontSize: 15, fontWeight: 500, color: "#18181B", lineHeight: 1.2, fontFamily: "Inter, sans-serif" }}>
                {tile.title}
              </p>
              <p style={{ fontSize: 12, fontWeight: 400, color: "#71717A", marginTop: 2, fontFamily: "Inter, sans-serif" }}>
                {tile.subtitle}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
