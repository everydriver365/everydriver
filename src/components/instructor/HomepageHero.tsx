import { format } from "date-fns";
import { motion } from "framer-motion";
import { PoundSterling, Clock, Shield } from "lucide-react";
import instructorHeroImg from "@/assets/hero-instructor.jpg";

interface HomepageHeroProps {
  firstName: string;
  heroImageUrl?: string | null;
  profileImageUrl?: string | null;
  weeklyLessonsScheduled: number;
  weeklyLessonsCompleted: number;
  weeklyLessonsTotal: number;
  todayCompleted: number;
  todayTotal: number;
  monthlyCompleted: number;
  monthlyScheduled: number;
  monthlyTotal: number;
  monthEarnings?: number;
  hoursThisWeek?: number;
  drivingScore?: number;
}

export function HomepageHero({
  firstName,
  heroImageUrl,
  profileImageUrl,
  todayTotal,
  monthEarnings = 0,
  hoursThisWeek = 0,
  drivingScore = 100,
}: HomepageHeroProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return `Good Morning, ${firstName}`;
    if (hour >= 12 && hour < 17) return `Good Afternoon, ${firstName}`;
    if (hour >= 17 && hour < 21) return `Good Evening, ${firstName}`;
    return `Hello, ${firstName}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="relative overflow-hidden hero-banner-no-top-radius" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {/* Background image */}
      <img
        src={heroImageUrl || instructorHeroImg}
        alt="Driving scene"
        className="absolute inset-0 h-full w-full object-cover !rounded-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      {/* Content */}
      <div className="relative z-10 px-5 pt-5 pb-4 flex flex-col gap-4">
        {/* Top row — avatar + greeting */}
        <div className="flex items-center gap-3">
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt={firstName}
              className="w-12 h-12 rounded-full object-cover border-2 border-white/30 shadow-lg"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/15 border-2 border-white/20 flex items-center justify-center">
              <span className="text-white font-semibold text-[17px]">
                {firstName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-[22px] font-bold text-white leading-tight"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
            >
              {getGreeting()}
            </motion.h1>
            <p className="text-[12px] text-white/60 mt-0.5">
              {format(new Date(), "EEEE d MMMM")}
            </p>
          </div>
        </div>

        {/* Today's lessons count */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-baseline gap-1.5"
        >
          <span className="text-[36px] font-extrabold text-white leading-none tabular-nums">
            {todayTotal}
          </span>
          <span className="text-[14px] font-medium text-white/50">
            lesson{todayTotal !== 1 ? "s" : ""} today
          </span>
        </motion.div>

        {/* Metric pills */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex gap-2"
        >
          {/* Earnings pill */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/12 backdrop-blur-sm border border-white/10">
            <PoundSterling className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[14px] font-bold text-white tabular-nums">
              £{monthEarnings.toLocaleString()}
            </span>
            <span className="text-[10px] text-white/45 font-medium">month</span>
          </div>

          {/* Hours pill */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/12 backdrop-blur-sm border border-white/10">
            <Clock className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-[14px] font-bold text-white tabular-nums">
              {hoursThisWeek}h
            </span>
            <span className="text-[10px] text-white/45 font-medium">week</span>
          </div>

          {/* Score pill */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/12 backdrop-blur-sm border border-white/10">
            <Shield className={`h-3.5 w-3.5 ${getScoreColor(drivingScore)}`} />
            <span className="text-[14px] font-bold text-white tabular-nums">
              {drivingScore}
            </span>
            <span className="text-[10px] text-white/45 font-medium">score</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
