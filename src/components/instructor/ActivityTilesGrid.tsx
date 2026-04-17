import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Briefcase, MessageSquare, ClipboardCheck, CalendarPlus, CheckCircle2, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ActivityTilesGridProps {
  pendingJobsCount: number;
  unreadMessagesCount: number;
  testRequestsCount: number;
  gapSlotsCount: number;
}

const tileConfig: { title: string; subtitle: string; icon: LucideIcon; iconColor: string; iconBg: string; route: string; key: string }[] = [
  {
    title: "Job Offers",
    subtitle: "Pending jobs",
    icon: Briefcase,
    iconColor: "#2A394F",
    iconBg: "#E8ECF1",
    route: "/instructor/jobs",
    key: "pendingJobsCount",
  },
  {
    title: "Messages",
    subtitle: "Unread chats",
    icon: MessageSquare,
    iconColor: "#1E40AF",
    iconBg: "#DBEAFE",
    route: "/instructor/messages",
    key: "unreadMessagesCount",
  },
  {
    title: "Tests",
    subtitle: "Swap requests",
    icon: ClipboardCheck,
    iconColor: "#92400E",
    iconBg: "#FEF3C7",
    route: "/instructor/test-requests",
    key: "testRequestsCount",
  },
  {
    title: "Fill Gaps",
    subtitle: "Open slots",
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

  const allZero = Object.values(counts).every(c => c === 0);

  if (allZero) {
    return (
      <div className="px-4 mt-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2 py-3 px-4"
          style={{ backgroundColor: "#ECFDF5", borderRadius: 14, border: "0.5px solid #E4E4E7" }}
        >
          <CheckCircle2 size={18} strokeWidth={2} color="#059669" />
          <span style={{ fontSize: 14, fontWeight: 500, color: "#059669", fontFamily: "Inter, sans-serif" }}>
            All clear — no actions needed
          </span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 mt-3">
      <div className="grid grid-cols-2 gap-[10px]">
        {tileConfig.map((tile, idx) => {
          const count = counts[tile.key];
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
                overflow: "hidden",
                border: "0.5px solid #E4E4E7",
                padding: "14px",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                cursor: "pointer",
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
                {count > 0 ? (
                  <span
                    className="flex items-center justify-center"
                    style={{
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      padding: "0 4px",
                      background: "#ff3b30",
                      color: "white",
                      fontSize: 10,
                      fontWeight: 700,
                      lineHeight: 1,
                      boxShadow: "0 1px 4px rgba(255,59,48,0.4)",
                    }}
                  >
                    {count > 9 ? "9+" : count}
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
    </div>
  );
}
