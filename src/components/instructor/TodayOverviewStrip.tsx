import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CalendarCheck, Clock, PoundSterling, MapPin } from "lucide-react";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { format, parse } from "date-fns";

interface TodayOverviewStripProps {
  instructorId: string | undefined;
}

export function TodayOverviewStrip({ instructorId }: TodayOverviewStripProps) {
  const { data: overview, isLoading } = useTodayOverview(instructorId);

  // Don't show loading state - just hide until data is ready
  if (isLoading || !overview || overview.lessonCount === 0) {
    return null;
  }

  // Parse TIME string (HH:mm:ss) from database - not ISO format
  const firstLessonTimeFormatted = overview.firstLessonTime 
    ? format(parse(overview.firstLessonTime, "HH:mm:ss", new Date()), "h:mm a")
    : null;

  return (
    <div className="px-4 mt-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Link to="/instructor/schedule">
          <div className="shadow-premium bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/15 dark:to-primary/10 backdrop-blur-sm rounded-2xl p-3 active:scale-[0.99] transition-transform">
            {/* Title */}
            <div className="flex items-center gap-1.5 mb-2">
              <CalendarCheck className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Today at a Glance</span>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-2">
              {/* Lessons */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex items-center justify-center w-6 h-6 rounded-2xl bg-violet-500/15 dark:bg-violet-500/20 mb-1">
                  <CalendarCheck className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-sm font-bold text-foreground">{overview.lessonCount}</span>
                <span className="text-[9px] text-muted-foreground -mt-0.5">Lessons</span>
              </div>

              {/* Hours */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex items-center justify-center w-6 h-6 rounded-2xl bg-primary/15 dark:bg-primary/20 mb-1">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-bold text-foreground">{overview.totalHours}h</span>
                <span className="text-[9px] text-muted-foreground -mt-0.5">Hours</span>
              </div>

              {/* Earnings */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex items-center justify-center w-6 h-6 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/20 mb-1">
                  <PoundSterling className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-bold text-foreground">£{overview.expectedEarnings}</span>
                <span className="text-[9px] text-muted-foreground -mt-0.5">Earn</span>
              </div>

              {/* First Pickup */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex items-center justify-center w-6 h-6 rounded-2xl bg-rose-500/15 dark:bg-rose-500/20 mb-1">
                  <MapPin className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                </div>
                <span className="text-sm font-bold text-foreground truncate max-w-[60px]">
                  {overview.firstPickupPostcode || firstLessonTimeFormatted || "—"}
                </span>
                <span className="text-[9px] text-muted-foreground -mt-0.5">First</span>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
