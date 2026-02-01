import { BookOpen, Clock, PoundSterling } from "lucide-react";
import { motion } from "framer-motion";

interface EarningsSummaryStripProps {
  lessonCount: number;
  totalHours: number;
  expectedEarnings: number;
}

export function EarningsSummaryStrip({
  lessonCount,
  totalHours,
  expectedEarnings,
}: EarningsSummaryStripProps) {
  if (lessonCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4"
    >
      <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-around">
          {/* Lessons */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1.5 text-primary">
              <BookOpen className="h-4 w-4" />
              <span className="font-bold text-lg">{lessonCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
              Lessons
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-border/50" />

          {/* Hours */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <Clock className="h-4 w-4" />
              <span className="font-bold text-lg">{totalHours}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
              Hours
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-border/50" />

          {/* Earnings */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <PoundSterling className="h-4 w-4" />
              <span className="font-bold text-lg">{expectedEarnings}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
              Expected
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
