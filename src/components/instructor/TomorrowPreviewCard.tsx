import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, AlertTriangle, ChevronRight, PoundSterling } from "lucide-react";
import { format, parse, addDays } from "date-fns";
import { Link } from "react-router-dom";

interface TomorrowPreviewCardProps {
  lessonCount: number;
  totalHours: number;
  expectedEarnings: number;
  firstLessonTime: string | null;
  lastLessonTime: string | null;
  hasGaps: boolean;
  className?: string;
}

export function TomorrowPreviewCard({
  lessonCount,
  totalHours,
  expectedEarnings,
  firstLessonTime,
  lastLessonTime,
  hasGaps,
  className = "",
}: TomorrowPreviewCardProps) {
  const tomorrow = addDays(new Date(), 1);
  const dayName = format(tomorrow, "EEEE");
  const dateStr = format(tomorrow, "d MMM");

  const formatTime = (time: string | null) => {
    if (!time) return "—";
    try {
      return format(parse(time, "HH:mm:ss", new Date()), "h:mm a");
    } catch {
      return time;
    }
  };

  if (lessonCount === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mx-4 ${className}`}
      >
        <Link to="/instructor/schedule">
          <div className="bg-muted/50 rounded-xl border border-dashed border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{dayName}'s Schedule</p>
                  <p className="text-xs text-muted-foreground">No lessons booked yet</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-4 ${className}`}
    >
      <Link to="/instructor/schedule">
        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/15 dark:to-indigo-500/15 rounded-xl border border-blue-500/20 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-foreground text-sm">{dayName}</span>
              <span className="text-xs text-muted-foreground">{dateStr}</span>
            </div>
            {hasGaps && (
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-[10px] font-medium">Has gaps</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <span className="text-lg font-bold">{lessonCount}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Lesson{lessonCount !== 1 ? "s" : ""}
              </span>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                <Clock className="h-3 w-3" />
                <span className="text-lg font-bold">{totalHours}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Hours</span>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <PoundSterling className="h-3 w-3" />
                <span className="text-lg font-bold">{expectedEarnings}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Expected</span>
            </div>
          </div>

          {/* Time range */}
          {firstLessonTime && lastLessonTime && (
            <div className="mt-3 pt-3 border-t border-blue-500/20 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatTime(firstLessonTime)} — {formatTime(lastLessonTime)}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
