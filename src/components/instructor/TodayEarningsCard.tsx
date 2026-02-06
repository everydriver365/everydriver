import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface TodayEarningsCardProps {
  todayEarnings: number;
  weekEarnings: number;
  className?: string;
}

export function TodayEarningsCard({ todayEarnings, weekEarnings, className }: TodayEarningsCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate("/instructor/money")}
      className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(20,37,66,0.08)] border border-border p-4 cursor-pointer flex-1 min-w-0"
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
        Today's Earnings
      </p>
      <p className="text-3xl font-bold text-foreground leading-tight">
        £{todayEarnings}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        This week: <span className="font-semibold text-foreground">£{weekEarnings}</span>
      </p>
    </motion.div>
  );
}
