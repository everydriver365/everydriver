import { format } from "date-fns";
import { motion } from "framer-motion";
import instructorHeroImg from "@/assets/hero-instructor.jpg";

interface HomepageHeroProps {
  firstName: string;
  heroImageUrl?: string | null;
  profileImageUrl?: string | null;
  weeklyLessonsScheduled: number;
  weeklyLessonsCompleted: number;
  weeklyLessonsTotal: number;
}

export function HomepageHero({
  firstName,
  heroImageUrl,
  profileImageUrl,
  weeklyLessonsScheduled,
  weeklyLessonsCompleted,
  weeklyLessonsTotal,
}: HomepageHeroProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return `Good Morning, ${firstName}`;
    if (hour >= 12 && hour < 17) return `Good Afternoon, ${firstName}`;
    if (hour >= 17 && hour < 21) return `Good Evening, ${firstName}`;
    return `Hello, ${firstName}`;
  };

  // Progress ring calculations
  const radius = 28;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  const total = weeklyLessonsTotal || 1;
  const completed = weeklyLessonsCompleted;
  const scheduled = weeklyLessonsScheduled;
  const completedProgress = Math.min(completed / total, 1);
  const scheduledProgress = Math.min(scheduled / total, 1);
  const completedOffset = circumference * (1 - completedProgress);
  const scheduledOffset = circumference * (1 - scheduledProgress);

  return (
    <div
      className="relative h-[200px] overflow-hidden hero-banner-no-top-radius"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Background image */}
      <img
        src={heroImageUrl || instructorHeroImg}
        alt="Driving scene"
        className="absolute inset-0 h-full w-full object-cover !rounded-none"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/50 to-transparent" />

      {/* Content layer */}
      <div className="absolute inset-0 flex flex-col justify-between p-5 pb-4">
        {/* Top — Avatar + Greeting */}
        <div className="flex items-center gap-3">
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt={firstName}
              className="w-11 h-11 rounded-full object-cover border-2 border-white/40 shadow-md"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
              <span className="text-white font-semibold text-[16px]">
                {firstName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-[22px] font-bold text-white leading-tight drop-shadow-md">
              {getGreeting()}
            </h1>
            <p className="text-[12px] text-white/70 -mt-0.5">
              {format(new Date(), "EEEE d MMMM")}
            </p>
          </div>
        </div>

        {/* Bottom — This Week tile */}
        <div
          className="bg-white/95 dark:bg-card/90 backdrop-blur-xl rounded-2xl p-3.5 flex items-center justify-between"
          style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.12)" }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              THIS WEEK
            </p>
            <p className="text-[17px] font-semibold text-foreground mt-0.5 leading-snug">
              {completed === total && total > 0 ? "All done! 🎉" : "Keep it moving!"}
            </p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {weeklyLessonsScheduled} lesson{weeklyLessonsScheduled !== 1 ? "s" : ""} scheduled
            </p>
          </div>

          {/* iOS-style progress ring */}
          <div className="relative w-[68px] h-[68px] shrink-0">
            <svg viewBox="0 0 68 68" className="w-full h-full -rotate-90">
              {/* Track */}
              <circle
                cx="34" cy="34" r={radius}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth={stroke}
                opacity={0.4}
              />
              {/* Gradient definitions */}
              <defs>
                <linearGradient id="ring-gradient-green" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
                <linearGradient id="ring-gradient-red" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F87171" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
              </defs>
              {/* Scheduled arc (red, behind green) */}
              <motion.circle
                cx="34" cy="34" r={radius}
                fill="none"
                stroke="url(#ring-gradient-red)"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: scheduledOffset }}
                transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
              />
              {/* Completed arc (green, on top) */}
              <motion.circle
                cx="34" cy="34" r={radius}
                fill="none"
                stroke="url(#ring-gradient-green)"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: completedOffset }}
                transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.4 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[17px] font-bold text-foreground leading-none tabular-nums">
                {completed}
              </span>
              <span className="text-[9px] font-medium text-muted-foreground leading-tight mt-0.5">
                of {total}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
