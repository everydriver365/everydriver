import { format, parse } from "date-fns";
import { motion } from "framer-motion";
import { Calendar, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TomorrowPeekCardProps {
  lessonCount: number;
  totalHours: number;
  expectedEarnings: number;
  firstLessonTime: string | null;
  className?: string;
}

export function TomorrowPeekCard({
  lessonCount,
  totalHours,
  expectedEarnings,
  firstLessonTime,
  className = "",
}: TomorrowPeekCardProps) {
  const navigate = useNavigate();

  if (lessonCount === 0) return null;

  const formatTime = (time: string) => {
    try {
      const parsed = parse(time, "HH:mm:ss", new Date());
      return format(parsed, "h:mm a");
    } catch {
      return time;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <button
        onClick={() => navigate("/instructor/diary")}
        className="w-full bg-white rounded-xl border border-border shadow-[0_2px_8px_rgba(20,37,66,0.08)] p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Tomorrow · {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {firstLessonTime ? `Starts ${formatTime(firstLessonTime)}` : ""} · {totalHours}h · £{expectedEarnings}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>
    </motion.div>
  );
}
