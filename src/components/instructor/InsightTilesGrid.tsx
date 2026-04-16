import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface InsightTile {
  title: string;
  subtitle: string;
  emoji: string;
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
      emoji: "➕",
      route: "/instructor/gaps",
      badge: gapCount,
    },
    {
      title: "Vehicle Health",
      subtitle: "MOT & service",
      emoji: "🚗",
      route: "/instructor/vehicle-health",
    },
    {
      title: "Smart Nudges",
      subtitle: "Action items",
      emoji: "✨",
      route: "/instructor/nudges",
    },
    {
      title: "Re-engage",
      subtitle: "Dormant pupils",
      emoji: "👤",
      route: "/instructor/dormant-pupils",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {tiles.map((tile, idx) => {
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
              borderRadius: 20,
              overflow: "hidden",
              border: "0.5px solid rgba(26,111,212,0.1)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
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
              <p style={{ fontSize: 15, fontWeight: 700, color: "#1c1c1e", marginBottom: 2, lineHeight: 1.2 }}>
                {tile.title}
              </p>
              <p style={{ fontSize: 12, fontWeight: 400, color: "#8e8e93" }}>
                {tile.subtitle}
              </p>
            </div>
            <div className="flex items-end justify-between" style={{ marginTop: "auto" }}>
              <div
                style={{
                  height: 2,
                  flex: 1,
                  background: "linear-gradient(to right, #0d4fa0, #56a8f5)",
                  borderRadius: 2,
                  marginRight: 10,
                }}
              />
               <span
                  style={{
                    fontSize: 30,
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                  }}
                >
                  {tile.emoji}
                </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
