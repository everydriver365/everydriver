import { motion } from "framer-motion";
import { CheckCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StatusBarProps {
  nextLessonMinutes?: number;
  lessonCount: number;
  className?: string;
}

export function StatusBar({ nextLessonMinutes, lessonCount, className }: StatusBarProps) {
  const navigate = useNavigate();

  const getStatusText = () => {
    if (lessonCount === 0) return "No lessons today";
    if (nextLessonMinutes === undefined || nextLessonMinutes <= 0) return "Lesson starting now!";
    const hours = Math.floor(nextLessonMinutes / 60);
    const mins = nextLessonMinutes % 60;
    const timeText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    return `Next lesson in ${timeText}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate("/instructor/schedule")}
      className="mx-4 bg-white rounded-2xl shadow-[0_2px_8px_rgba(20,37,66,0.08)] border border-border px-4 py-3.5 flex items-center gap-2.5 cursor-pointer"
    >
      <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
      <span className="text-sm font-medium text-foreground flex-1">
        All set for today 👍 {getStatusText()}
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </motion.div>
  );
}
