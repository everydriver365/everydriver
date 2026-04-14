import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Briefcase, ChatCircle, Exam, CalendarPlus, Question } from "phosphor-react";

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
      icon: ChatCircle,
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
      icon: Exam,
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
      <div className="px-5 mt-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2 py-3 px-4"
          style={{ borderRadius: 22, backgroundColor: "rgba(15, 118, 110, 0.08)" }}
        >
          <CheckCircle2 className="h-4 w-4" style={{ color: "#0F766E" }} />
          <span className="text-sm font-medium" style={{ color: "#0F766E" }}>
            All clear — no actions needed
          </span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-5 mt-4 grid grid-cols-4 gap-3">
      {activeTiles.map((tile, idx) => (
        <motion.div
          key={tile.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate(tile.route)}
          className="aspect-square text-center cursor-pointer flex flex-col items-center justify-center gap-1.5"
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 22,
            border: "1px solid #DAE4E1",
            boxShadow: "0 2px 12px rgba(15, 70, 60, 0.06), 0 1px 4px rgba(15, 70, 60, 0.03)",
            padding: 8,
          }}
        >
          {/* Icon with badge counter */}
          <div className="relative">
            {(() => {
              const IconComp = typeof tile.icon === 'function' ? tile.icon : Question;
              return (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#0F766E" }}
                >
                  <IconComp size={18} weight="fill" className="text-white" />
                </div>
              );
            })()}
            {tile.count > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1 leading-none"
                style={{ backgroundColor: "#E45A3B" }}
              >
                {tile.count > 99 ? "99+" : tile.count}
              </span>
            )}
          </div>
          {/* Title */}
          <p className="text-[10px] font-semibold leading-tight" style={{ color: "#6A7A78" }}>
            {tile.title}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
