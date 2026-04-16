import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Briefcase, MessageSquare, ClipboardCheck, CalendarPlus, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ActivityTilesGridProps {
  pendingJobsCount: number;
  unreadMessagesCount: number;
  testRequestsCount: number;
  gapSlotsCount: number;
}

const tileConfig: { title: string; icon: LucideIcon; iconColor: string; iconBg: string; route: string; key: string }[] = [
  {
    title: "Job Offers",
    icon: Briefcase,
    iconColor: "#4F46E5",
    iconBg: "#EEF2FF",
    route: "/instructor/jobs",
    key: "pendingJobsCount",
  },
  {
    title: "Messages",
    icon: MessageSquare,
    iconColor: "#1E40AF",
    iconBg: "#DBEAFE",
    route: "/instructor/messages",
    key: "unreadMessagesCount",
  },
  {
    title: "Tests",
    icon: ClipboardCheck,
    iconColor: "#92400E",
    iconBg: "#FEF3C7",
    route: "/instructor/test-requests",
    key: "testRequestsCount",
  },
  {
    title: "Fill Gaps",
    icon: CalendarPlus,
    iconColor: "#059669",
    iconBg: "#ECFDF5",
    route: "/instructor/gaps",
    key: "gapSlotsCount",
  },
];

export function ActivityTilesGrid({
  pendingJobsCount,
  unreadMessagesCount,
  testRequestsCount,
  gapSlotsCount,
}: ActivityTilesGridProps) {
  const navigate = useNavigate();

  const counts: Record<string, number> = {
    pendingJobsCount,
    unreadMessagesCount,
    testRequestsCount,
    gapSlotsCount,
  };

  // Always show all 4 tiles in 2x2 grid
  const allZero = Object.values(counts).every(c => c === 0);

  if (allZero) {
    return (
      <div className="px-4 mt-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-full"
          style={{ backgroundColor: "rgba(52,199,89,0.1)" }}
        >
          <CheckCircle2 className="h-4 w-4" style={{ color: "#34C759" }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: "#34C759", fontFamily: "-apple-system, 'SF Pro Text', sans-serif" }}>
            All clear — no actions needed
          </span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 mt-3" style={{ fontFamily: "-apple-system, 'SF Pro Text', sans-serif" }}>
      <div className="grid grid-cols-2 gap-3">
        {tileConfig.map((tile, idx) => {
          const count = counts[tile.key];
          const Icon = tile.icon;
          return (
            <motion.button
              key={tile.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileTap={{ scale: 0.97 }}
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
              {count > 0 && (
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
                  {count > 99 ? "99+" : count}
                </span>
              )}
              <div>
                <p style={{ fontSize: 15, fontWeight: 500, color: "#18181B", marginBottom: 2, lineHeight: 1.2 }}>
                  {tile.title}
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
    </div>
  );
}
