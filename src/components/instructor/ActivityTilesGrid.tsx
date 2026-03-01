import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, CheckCircle, Calendar } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import jobOffersIcon from "@/assets/job-offers-icon.png";

interface ActivityTile {
  title: string;
  subtitle: string;
  count: number;
  accent: string;
  icon: React.ReactNode;
  route: string;
}

interface ActivityTilesGridProps {
  pendingJobsCount: number;
  unreadMessagesCount: number;
  testRequestsCount: number;
  gapSlotsCount: number;
}

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
      subtitle: "Available",
      count: pendingJobsCount,
      accent: "#AF52DE",
      icon: (
        <img
          src={jobOffersIcon}
          alt="Job Offers"
          className="w-full h-full object-cover rounded-[10px]"
        />
      ),
      route: "/instructor/jobs",
    },
    {
      title: "Messages",
      subtitle: "Unread",
      count: unreadMessagesCount,
      accent: "#FF9500",
      icon: <Mail size={20} strokeWidth={1.8} style={{ color: "#FF9500" }} />,
      route: "/instructor/messages",
    },
    {
      title: "Test Requests",
      subtitle: "Pending",
      count: testRequestsCount,
      accent: "#5AC8FA",
      icon: <CheckCircle size={20} strokeWidth={1.8} style={{ color: "#5AC8FA" }} />,
      route: "/instructor/test-requests",
    },
    {
      title: "Fill Gaps",
      subtitle: "Open slots",
      count: gapSlotsCount,
      accent: "#FF2D55",
      icon: <Calendar size={20} strokeWidth={1.8} style={{ color: "#FF2D55" }} />,
      route: "/instructor/gaps",
    },
  ];

  return (
    <div className="px-4 mt-4 grid grid-cols-2 gap-3">
      {tiles.map((tile, idx) => (
        <motion.button
          key={tile.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate(tile.route)}
          className="bg-card rounded-[14px] p-[14px] text-left"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
        >
          {/* Top row: icon + count */}
          <div className="flex items-center justify-between">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${tile.accent}1F` }}
            >
              {tile.icon}
            </div>
            <span className="text-[28px] font-bold text-foreground leading-none">
              <AnimatedCounter value={tile.count} className="tabular-nums" />
            </span>
          </div>
          {/* Title + subtitle */}
          <p className="text-[15px] font-semibold text-foreground mt-2.5 leading-tight">
            {tile.title}
          </p>
          <p className="text-[12px] text-muted-foreground leading-tight mt-0.5">
            {tile.subtitle}
          </p>
        </motion.button>
      ))}
    </div>
  );
}
