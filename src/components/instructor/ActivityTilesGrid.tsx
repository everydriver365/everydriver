import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { CheckCircle2, Briefcase, MessageSquare, FileText, CalendarPlus } from "lucide-react";

interface ActivityTile {
  title: string;
  subtitle: string;
  count: number;
  accent: string;
  gradient: string;
  icon: React.ElementType;
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
      gradient: "linear-gradient(135deg, #AF52DE, #8B3FBF)",
      icon: Briefcase,
      route: "/instructor/jobs",
      actionLabel: "VIEW JOBS",
      actionRoute: "/instructor/jobs",
    },
    {
      title: "Messages",
      subtitle: "Unread",
      count: unreadMessagesCount,
      accent: "#FF9500",
      gradient: "linear-gradient(135deg, #FF9500, #E08600)",
      icon: MessageSquare,
      route: "/instructor/messages",
      actionLabel: "NEW MSG",
      actionRoute: "/instructor/messages",
    },
    {
      title: "Tests",
      subtitle: "Pending",
      count: testRequestsCount,
      accent: "#5AC8FA",
      gradient: "linear-gradient(135deg, #5AC8FA, #4AB0E0)",
      icon: FileText,
      route: "/instructor/test-requests",
      actionLabel: "VIEW ALL",
      actionRoute: "/instructor/test-requests",
    },
    {
      title: "Fill Gaps",
      subtitle: "Open slots",
      count: gapSlotsCount,
      accent: "#FF2D55",
      gradient: "linear-gradient(135deg, #FF2D55, #E0264B)",
      icon: CalendarPlus,
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
          className="aspect-square rounded-2xl p-2 text-center border-0 transition-all duration-200 ease-out cursor-pointer flex flex-col items-center justify-center gap-1.5"
          style={{
            backgroundColor: "#FFFFFF",
            boxShadow: "0px 2px 12px rgba(0,0,0,0.06), 0px 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {/* Icon with badge counter */}
          <div className="relative">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: tile.gradient }}
            >
              <tile.icon size={18} strokeWidth={2} className="text-white" />
            </div>
            {tile.count > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1 leading-none"
                style={{ backgroundColor: tile.accent }}
              >
                {tile.count > 99 ? "99+" : tile.count}
              </span>
            )}
          </div>
          {/* Title */}
          <p className="text-[10px] font-semibold text-muted-foreground leading-tight">
            {tile.title}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
