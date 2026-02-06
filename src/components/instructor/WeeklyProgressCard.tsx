import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface WeeklyProgressCardProps {
  lessonsCompleted: number;
  lessonsGoal: number;
  className?: string;
}

export function WeeklyProgressCard({ lessonsCompleted, lessonsGoal, className }: WeeklyProgressCardProps) {
  const navigate = useNavigate();
  const progressPercent = lessonsGoal > 0 ? Math.min((lessonsCompleted / lessonsGoal) * 100, 100) : 0;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate("/instructor/money")}
      className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(20,37,66,0.08)] border border-border p-4 cursor-pointer flex-1 min-w-0"
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
        Weekly Progress
      </p>
      <p className="text-sm text-foreground mt-1">
        <span className="font-bold">Lessons</span> completed{" "}
        <span className="font-bold text-primary">{lessonsCompleted}</span>
        <span className="text-muted-foreground"> / {lessonsGoal}</span>
      </p>
      {/* Progress bar */}
      <div className="mt-2.5 h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80"
        />
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate("/instructor/money");
        }}
        className="text-xs text-primary font-medium mt-2 hover:underline"
      >
        View breakdown &gt;
      </button>
    </motion.div>
  );
}
