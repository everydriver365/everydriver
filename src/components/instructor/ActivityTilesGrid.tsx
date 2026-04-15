import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import jobOffersIcon from "@/assets/job-offers-icon.png";

interface ActivityTile {
  title: string;
  count: number;
  iconBg: string;
  iconColor: string;
  route: string;
  useCustomIcon?: boolean;
  icon?: React.ReactNode;
}

interface ActivityTilesGridProps {
  pendingJobsCount: number;
  unreadMessagesCount: number;
  testRequestsCount: number;
  gapSlotsCount: number;
}

// Simple SVG icons matching iOS style
const MessagesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M21 11.5C21 16.75 16.75 21 11.5 21C9.8 21 8.2 20.6 6.8 19.8L3 21L4.2 17.2C3.4 15.8 3 14.2 3 12.5C3 7.25 7.25 3 12.5 3C17.75 3 21 6.25 21 11.5Z" fill="#D97706"/>
    <circle cx="9" cy="12" r="1.2" fill="white"/>
    <circle cx="12.5" cy="12" r="1.2" fill="white"/>
    <circle cx="16" cy="12" r="1.2" fill="white"/>
  </svg>
);

const TestsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="3" width="16" height="18" rx="2" fill="#0A7AFF"/>
    <path d="M8 8h8M8 12h6M8 16h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const FillGapsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="3" fill="#DC2626"/>
    <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export function ActivityTilesGrid({
  pendingJobsCount,
  unreadMessagesCount,
  testRequestsCount,
  gapSlotsCount,
}: ActivityTilesGridProps) {
  const navigate = useNavigate();

  const tiles: ActivityTile[] = [
    {
      title: "Job Offers",
      count: pendingJobsCount,
      iconBg: "transparent",
      iconColor: "",
      route: "/instructor/jobs",
      useCustomIcon: true,
    },
    {
      title: "Messages",
      count: unreadMessagesCount,
      iconBg: "#FEF3C7",
      iconColor: "#D97706",
      route: "/instructor/messages",
      icon: <MessagesIcon />,
    },
    {
      title: "Tests",
      count: testRequestsCount,
      iconBg: "#E0F2FE",
      iconColor: "#0A7AFF",
      route: "/instructor/test-requests",
      icon: <TestsIcon />,
    },
    {
      title: "Fill Gaps",
      count: gapSlotsCount,
      iconBg: "#FEE2E2",
      iconColor: "#DC2626",
      route: "/instructor/gaps",
      icon: <FillGapsIcon />,
    },
  ];

  // Always show Messages and Fill Gaps, hide others if count is 0
  const alwaysShow = ["Messages", "Fill Gaps"];
  const activeTiles = tiles.filter(t => alwaysShow.includes(t.title) || t.count > 0);

  if (activeTiles.length === 0) {
    return (
      <div className="px-4 mt-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-full"
          style={{ backgroundColor: "rgba(48, 209, 88, 0.1)" }}
        >
          <CheckCircle2 className="h-4 w-4" style={{ color: "#30D158" }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: "#30D158", fontFamily: "-apple-system, 'SF Pro Text', sans-serif" }}>
            All clear — no actions needed
          </span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 mt-3">
      <div className="grid grid-cols-2 gap-[10px]">
        {activeTiles.map((tile, idx) => (
          <motion.button
            key={tile.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(tile.route)}
            className="relative flex flex-col items-center justify-center gap-2 py-4"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              border: "0.5px solid #E5E5EA",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              fontFamily: "-apple-system, 'SF Pro Text', sans-serif",
            }}
          >
            {/* Badge */}
            {tile.count > 0 && (
              <span
                className="absolute flex items-center justify-center"
                style={{
                  top: 8, right: 8,
                  minWidth: 20, height: 20, borderRadius: 10,
                  backgroundColor: "#FF3B30",
                  color: "#fff",
                  fontSize: 11, fontWeight: 700,
                  paddingLeft: 5, paddingRight: 5,
                  border: "2px solid #F2F2F7",
                }}
              >
                {tile.count > 99 ? "99+" : tile.count}
              </span>
            )}

            {/* Icon */}
            <div
              className="flex items-center justify-center"
              style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: tile.useCustomIcon ? "transparent" : tile.iconBg,
              }}
            >
              {tile.useCustomIcon ? (
                <img src={jobOffersIcon} alt="Job Offers" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }} />
              ) : (
                tile.icon
              )}
            </div>

            {/* Label */}
            <span style={{ fontSize: 10, fontWeight: 500, color: "#3C3C43" }}>
              {tile.title}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
