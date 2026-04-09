import { format } from "date-fns";
import { motion } from "framer-motion";
import instructorHeroImg from "@/assets/hero-instructor.jpg";

interface DavidLloydHeroProps {
  firstName: string;
  heroImageUrl?: string | null;
  profileImageUrl?: string | null;
  todayCompleted: number;
  todayTotal: number;
  motivationTitle?: string;
  motivationSubtitle?: string;
}

function ProgressCircle({ completed, total, size = 64 }: { completed: number; total: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const t = total || 1;
  const progress = Math.min(completed / t, 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={4}
          opacity={0.3}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[18px] font-bold text-foreground leading-none tabular-nums">
          {completed}/{total}
        </span>
        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide mt-0.5">
          Lessons
        </span>
      </div>
    </div>
  );
}

export function DavidLloydHero({
  firstName,
  heroImageUrl,
  profileImageUrl,
  todayCompleted,
  todayTotal,
  motivationTitle,
  motivationSubtitle,
}: DavidLloydHeroProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return `Good Morning`;
    if (hour >= 12 && hour < 17) return `Good Afternoon`;
    if (hour >= 17 && hour < 21) return `Good Evening`;
    return `Hello`;
  };

  return (
    <div className="relative">
      {/* Hero image — clean, full-width, no text overlay */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: "200px", paddingTop: "env(safe-area-inset-top)" }}
      >
        <img
          src={heroImageUrl || instructorHeroImg}
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/20" />

        {/* Top — minimal avatar + greeting */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center gap-3" style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt={firstName}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/50 shadow-lg"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-bold text-[15px]">
                {firstName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-white/80 text-[13px] font-medium">{getGreeting()}</p>
            <p className="text-white text-[18px] font-bold leading-tight drop-shadow-md">
              {firstName}
            </p>
          </div>
        </div>
      </div>

      {/* Overlapping motivation card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="-mt-8 mx-4 bg-card rounded-2xl p-4 flex items-center justify-between relative z-10"
        style={{
          boxShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
            {format(new Date(), "EEEE d MMMM")}
          </p>
          <p className="text-[17px] font-bold text-foreground mt-1 leading-snug">
            {motivationTitle || (todayCompleted === todayTotal && todayTotal > 0 ? "All done! 🎉" : "Let's get moving!")}
          </p>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {motivationSubtitle || `${todayTotal} lesson${todayTotal !== 1 ? "s" : ""} today`}
          </p>
        </div>
        <ProgressCircle completed={todayCompleted} total={todayTotal} size={64} />
      </motion.div>
    </div>
  );
}
