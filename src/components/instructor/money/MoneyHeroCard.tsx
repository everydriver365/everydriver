import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MoneyHeroCardProps {
  thisMonth: number;
  lastMonth: number;
  thisWeek: number;
  hoursThisMonth: number;
  hourlyRate: number;
  isLoading?: boolean;
}

export function MoneyHeroCard({
  thisMonth,
  lastMonth,
  thisWeek,
  hoursThisMonth,
  hourlyRate,
  isLoading = false,
}: MoneyHeroCardProps) {
  const monthChange = lastMonth > 0 
    ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
    : thisMonth > 0 ? 100 : 0;

  const isPositive = monthChange >= 0;

  // Calculate progress towards a typical monthly target (£4000)
  const monthlyTarget = 4000;
  const progress = Math.min((thisMonth / monthlyTarget) * 100, 100);
  const moneyRadius = 42;
  const circumference = 2 * Math.PI * moneyRadius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4 text-white"
    >
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/5 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Top row - Month label and change badge */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wider">
              This Month
            </span>
          </div>
          {monthChange !== 0 && (
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs font-semibold",
                isPositive 
                  ? "bg-emerald-400/20 text-emerald-100 border-emerald-400/30" 
                  : "bg-rose-400/20 text-rose-100 border-rose-400/30"
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-0.5" />
              )}
              {Math.abs(monthChange)}% vs last
            </Badge>
          )}
        </div>

        {/* Center - Big earnings with progress ring */}
        <div className="flex items-center gap-4 my-3">
          {/* Progress ring */}
          <div className="relative w-[100px] h-[100px] flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r={moneyRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-white/10"
              />
              {/* Progress ring with gradient */}
              <defs>
                <linearGradient id="moneyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <motion.circle
                cx="50"
                cy="50"
                r={moneyRadius}
                fill="none"
                stroke="url(#moneyGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{ filter: "drop-shadow(0 0 8px rgba(52, 211, 153, 0.5))" }}
              />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] text-primary-foreground/50 uppercase">Earned</span>
              <motion.span 
                className="text-2xl font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                £{thisMonth.toLocaleString()}
              </motion.span>
              <span className="text-[10px] text-primary-foreground/60">
                of £{monthlyTarget.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Stats column */}
          <div className="flex-1 space-y-3">
            <div className="p-3 rounded-2xl bg-white shadow-lift/10 backdrop-blur-sm">
              <p className="text-[10px] text-primary-foreground/60 uppercase tracking-wide">This Week</p>
              <p className="text-xl font-bold">£{thisWeek.toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 p-2.5 rounded-2xl bg-white shadow-lift/10 backdrop-blur-sm">
                <p className="text-[9px] text-primary-foreground/60 uppercase">Hours</p>
                <p className="text-lg font-semibold">{hoursThisMonth}h</p>
              </div>
              <div className="flex-1 p-2.5 rounded-2xl bg-white shadow-lift/10 backdrop-blur-sm">
                <p className="text-[9px] text-primary-foreground/60 uppercase">Rate</p>
                <p className="text-lg font-semibold">£{hourlyRate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
