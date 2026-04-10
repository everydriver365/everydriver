import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Lightbulb, Clock, Briefcase, ChevronRight } from "lucide-react";
import { useBreakReminders } from "@/hooks/useBreakReminders";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { format } from "date-fns";

export function SmartRemindersCard() {
  const { nextBreak, formatBreakTime, getBreakDescription } = useBreakReminders();
  const pendingJobsCount = usePendingJobsCount();

  // Only show if there's a gap AND pending jobs
  if (!nextBreak || pendingJobsCount === 0) {
    return null;
  }

  const gapTime = formatBreakTime(nextBreak.startTime);
  const gapDuration = getBreakDescription(nextBreak);

  return (
    <div className="px-4 mt-3">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Link to="/instructor/jobs">
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 dark:from-amber-500/15 dark:via-amber-500/20 dark:to-amber-500/15 backdrop-blur-sm rounded-none border border-amber-500/30 p-3 flex items-center gap-3 active:scale-[0.99] transition-transform">
            {/* Icon */}
            <div className="flex items-center justify-center w-10 h-10 rounded-none bg-amber-500/20 dark:bg-amber-500/25 shrink-0">
              <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Smart Tip
                </span>
              </div>
              <p className="text-sm font-medium text-foreground leading-tight">
                You have a {gapDuration} at {gapTime}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {pendingJobsCount} job offer{pendingJobsCount > 1 ? "s" : ""} waiting
              </p>
            </div>

            {/* Arrow */}
            <ChevronRight className="h-5 w-5 text-amber-500/60 shrink-0" />
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
