import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { CheckCircle2 } from "lucide-react";
import jobOffersIcon from "@/assets/job-offers-icon.png";
import messagesIcon from "@/assets/messages-icon.png";
import testRequestsIcon from "@/assets/test-requests-icon.png";
import fillGapsIcon from "@/assets/fill-gaps-icon.png";

interface ActivityTile {
  title: string;
  subtitle: string;
  count: number;
  accent: string;
  icon: React.ReactNode;
  route: string;
  actionLabel: string;
  actionRoute: string;
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

  const allTiles: ActivityTile[] = [
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
      actionLabel: "VIEW JOBS",
      actionRoute: "/instructor/jobs",
    },
    {
      title: "Messages",
      subtitle: "Unread",
      count: unreadMessagesCount,
      accent: "#FF9500",
      icon: (
        <img
          src={messagesIcon}
          alt="Messages"
          className="w-full h-full object-cover rounded-[10px]"
        />
      ),
      route: "/instructor/messages",
      actionLabel: "NEW MSG",
      actionRoute: "/instructor/messages",
    },
    {
      title: "Test Requests",
      subtitle: "Pending",
      count: testRequestsCount,
      accent: "#5AC8FA",
      icon: (
        <img
          src={testRequestsIcon}
          alt="Test Requests"
          className="w-full h-full object-cover rounded-[10px]"
        />
      ),
      route: "/instructor/test-requests",
      actionLabel: "VIEW ALL",
      actionRoute: "/instructor/test-requests",
    },
    {
      title: "Fill Gaps",
      subtitle: "Open slots",
      count: gapSlotsCount,
      accent: "#FF2D55",
      icon: (
        <img
          src={fillGapsIcon}
          alt="Fill Gaps"
          className="w-full h-full object-cover rounded-[10px]"
        />
      ),
      route: "/instructor/gaps",
      actionLabel: "FILL NOW",
      actionRoute: "/instructor/gaps",
    },
  ];

  // Filter: always show Messages and Fill Gaps, hide others if count is 0
  const alwaysShowTitles = ["Messages", "Fill Gaps"];
  const activeTiles = allTiles.filter((t) => alwaysShowTitles.includes(t.title) || t.count > 0);

  // All clear state
  if (activeTiles.length === 0) {
    return (
      <div className="px-4 mt-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-emerald-500/10"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            All clear — no actions needed
          </span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 mt-4 grid grid-cols-4 gap-2">
      {activeTiles.map((tile, idx) => (
        <motion.div
          key={tile.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate(tile.route)}
          className="rounded-2xl p-2.5 pb-2 text-center border-0 transition-all duration-200 ease-out cursor-pointer flex flex-col items-center"
          style={{
            backgroundColor: "#F2F3F5",
            boxShadow: "inset 0px 1px 0px rgba(255,255,255,0.6), 0px 4px 12px rgba(0,0,0,0.06), 0px 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {/* Icon */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#E6E8EC" }}
          >
            {tile.icon}
          </div>
          {/* Count */}
          <span className="text-[20px] font-bold text-foreground leading-none mt-1.5">
            <AnimatedCounter value={tile.count} className="tabular-nums" />
          </span>
          {/* Title */}
          <p className="text-[10px] font-semibold text-muted-foreground mt-0.5 leading-tight">
            {tile.title}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
