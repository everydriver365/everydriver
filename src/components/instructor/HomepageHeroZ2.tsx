import { format } from "date-fns";
import { motion } from "framer-motion";
import { Clock, CheckCircle, TrendingUp, PoundSterling, ChevronRight } from "lucide-react";

interface HomepageHeroZ2Props {
  firstName: string;
  todayCompleted: number;
  todayTotal: number;
  weekCompleted: number;
  weekTotal: number;
  expectedEarnings: number;
  totalHours: number;
  nextLessonTime?: string | null;
  nextPupilName?: string | null;
  nextPickupLocation?: string | null;
  onNextLessonClick?: () => void;
}

export function HomepageHeroZ2({
  firstName,
  todayCompleted,
  todayTotal,
  weekCompleted,
  weekTotal,
  expectedEarnings,
  totalHours,
  nextLessonTime,
  nextPupilName,
  nextPickupLocation,
  onNextLessonClick,
}: HomepageHeroZ2Props) {
  const dateStr = format(new Date(), "EEEE d MMMM");
  const greeting = (() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Good morning";
    if (h >= 12 && h < 17) return "Good afternoon";
    if (h >= 17 && h < 21) return "Good evening";
    return "Hello";
  })();

  const pct = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;
  const todayR = 32;
  const c = 2 * Math.PI * todayR;

  const formatTime = (time: string) => {
    const [h, m] = time.split(":");
    return `${h}:${m}`;
  };

  return (
    <div className="px-4 pt-3 pb-2">
      <p className="text-[11px] text-muted-foreground font-medium">{dateStr}</p>
      <h1 className="text-[34px] font-bold text-foreground leading-tight tracking-tight mb-4">{greeting}</h1>

      <div className="grid grid-cols-2 gap-3">
        {/* Ring widget — Today */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-[20px] border border-border/30 shadow-sm p-4 flex flex-col items-center"
        >
          <div className="relative w-[72px] h-[72px]">
            <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
              <circle cx="36" cy="36" r={todayR} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              <motion.circle
                cx="36" cy="36" r={todayR} fill="none"
                stroke="#10B981" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={c}
                initial={{ strokeDashoffset: c }}
                animate={{ strokeDashoffset: c * (1 - pct / 100) }}
                transition={{ duration: 1.2 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-foreground leading-none">{todayCompleted}</span>
              <span className="text-[10px] text-muted-foreground">of {todayTotal}</span>
            </div>
          </div>
          <p className="text-[13px] font-semibold text-foreground mt-2">Today</p>
          <p className="text-[11px] text-muted-foreground">
            {todayTotal - todayCompleted} remaining
          </p>
        </motion.div>

        {/* Next up widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          onClick={onNextLessonClick}
          className="bg-card rounded-[20px] border border-border/30 shadow-sm p-4 flex flex-col justify-between cursor-pointer"
        >
          {nextLessonTime && nextPupilName ? (
            <>
              <div>
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-[13px] font-semibold text-foreground">Next Lesson</p>
                <p className="text-[22px] font-bold text-foreground leading-tight mt-0.5">
                  {formatTime(nextLessonTime)}
                </p>
              </div>
              <div className="mt-2">
                <p className="text-[13px] text-foreground font-medium">{nextPupilName}</p>
                {nextPickupLocation && (
                  <p className="text-[11px] text-muted-foreground truncate">{nextPickupLocation}</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-[13px] font-semibold text-foreground">All Done!</p>
              <p className="text-[11px] text-muted-foreground">No more lessons</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Full-width schedule summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-card rounded-[20px] border border-border/30 shadow-sm mt-3 overflow-hidden"
      >
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-[13px] font-semibold text-foreground">This Week</span>
            </div>
            <span className="text-[13px] text-primary font-medium">{weekCompleted}/{weekTotal}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${weekTotal > 0 ? (weekCompleted / weekTotal) * 100 : 0}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
        </div>
        {expectedEarnings > 0 && (
          <div className="border-t border-border/30 px-4 py-2.5 flex items-center gap-2">
            <PoundSterling className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[13px] text-foreground">
              £{expectedEarnings} expected · {totalHours}h scheduled
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
