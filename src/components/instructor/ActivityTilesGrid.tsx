import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

interface ActivityTilesGridProps {
  pendingJobsCount: number;
  unreadMessagesCount: number;
  testRequestsCount: number;
  gapSlotsCount: number;
}

// Large, friendly flat SVG icons
const JobOffersIcon = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
    <rect x="4" y="10" width="40" height="30" rx="4" fill="#FFCC00" />
    <path d="M4 14l20 13L44 14" stroke="#E6B800" strokeWidth="2" fill="none" />
    <rect x="16" y="6" width="16" height="12" rx="2" fill="#FFFFFF" />
    <path d="M20 10h8M20 14h5" stroke="#FFCC00" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MessagesIcon = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
    <path d="M6 12C6 9.79 7.79 8 10 8h28c2.21 0 4 1.79 4 4v20c0 2.21-1.79 4-4 4H16l-8 6V12z" fill="#FF9500" />
    <circle cx="17" cy="22" r="2.5" fill="white" />
    <circle cx="24" cy="22" r="2.5" fill="white" />
    <circle cx="31" cy="22" r="2.5" fill="white" />
  </svg>
);

const TestsIcon = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
    <rect x="8" y="4" width="32" height="40" rx="5" fill="#007AFF" />
    <path d="M16 16h16M16 24h12M16 32h8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const FillGapsIcon = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
    <rect x="4" y="4" width="40" height="40" rx="10" fill="#FF6B8A" />
    <path d="M24 14v20M14 24h20" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
);

const tileConfig = [
  {
    title: "Job Offers",
    icon: <JobOffersIcon />,
    route: "/instructor/jobs",
    key: "pendingJobsCount" as const,
  },
  {
    title: "Messages",
    icon: <MessagesIcon />,
    route: "/instructor/messages",
    key: "unreadMessagesCount" as const,
  },
  {
    title: "Tests",
    icon: <TestsIcon />,
    route: "/instructor/test-requests",
    key: "testRequestsCount" as const,
  },
  {
    title: "Fill Gaps",
    icon: <FillGapsIcon />,
    route: "/instructor/gaps",
    key: "gapSlotsCount" as const,
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
                <p style={{ fontSize: 15, fontWeight: 700, color: "#1c1c1e", marginBottom: 2, lineHeight: 1.2 }}>
                  {tile.title}
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
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#E6E8EC",
                    flexShrink: 0,
                  }}
                >
                  {tile.icon}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
