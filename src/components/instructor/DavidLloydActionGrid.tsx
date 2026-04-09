import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Calendar, Briefcase, MessageSquare, ClipboardList, Zap } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

interface DavidLloydActionGridProps {
  pendingJobsCount: number;
  unreadMessagesCount: number;
  testRequestsCount: number;
  gapSlotsCount: number;
}

export function DavidLloydActionGrid({
  pendingJobsCount,
  unreadMessagesCount,
  testRequestsCount,
  gapSlotsCount,
}: DavidLloydActionGridProps) {
  const navigate = useNavigate();

  const tiles = [
    {
      title: "Job Offers",
      count: pendingJobsCount,
      icon: Briefcase,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      route: "/instructor/jobs",
    },
    {
      title: "Messages",
      count: unreadMessagesCount,
      icon: MessageSquare,
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
      route: "/instructor/messages",
    },
    {
      title: "Test Requests",
      count: testRequestsCount,
      icon: ClipboardList,
      iconBg: "bg-sky-100 dark:bg-sky-900/30",
      iconColor: "text-sky-600 dark:text-sky-400",
      route: "/instructor/test-requests",
    },
    {
      title: "Fill Gaps",
      count: gapSlotsCount,
      icon: Zap,
      iconBg: "bg-rose-100 dark:bg-rose-900/30",
      iconColor: "text-rose-600 dark:text-rose-400",
      route: "/instructor/gaps",
    },
  ];

  return (
    <div className="px-4 mt-5 space-y-3">
      {/* Full-width schedule tile */}
      <motion.button
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/instructor/diary")}
        className="w-full bg-primary text-primary-foreground rounded-2xl p-4 flex items-center gap-3 shadow-md"
      >
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <Calendar className="h-5 w-5" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[15px] font-bold">View Schedule</p>
          <p className="text-[12px] opacity-80">See your full timetable</p>
        </div>
        <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </motion.button>

      {/* 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile, idx) => {
          const Icon = tile.icon;
          return (
            <motion.button
              key={tile.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + idx * 0.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(tile.route)}
              className="bg-card rounded-2xl p-4 text-left border border-border/50 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl ${tile.iconBg} flex items-center justify-center`}>
                  <Icon className={`h-[18px] w-[18px] ${tile.iconColor}`} />
                </div>
                {tile.count > 0 && (
                  <span className="min-w-[24px] h-6 rounded-full bg-destructive text-destructive-foreground text-[12px] font-bold flex items-center justify-center px-1.5">
                    <AnimatedCounter value={tile.count} />
                  </span>
                )}
              </div>
              <p className="text-[14px] font-semibold text-foreground leading-tight">
                {tile.title}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
