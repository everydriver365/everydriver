import { format } from "date-fns";
import { motion } from "framer-motion";
import instructorHeroImg from "@/assets/hero-learner.jpg";

interface HomepageHeroProps {
  firstName: string;
  heroImageUrl?: string | null;
  weeklyLessonsScheduled: number;
  weeklyLessonsCompleted: number;
  weeklyLessonsTotal: number;
}

export function HomepageHero({
  firstName,
  heroImageUrl,
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
  const radius = 26;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const total = weeklyLessonsTotal || 1;
  const completed = weeklyLessonsCompleted;
  const progress = Math.min(completed / total, 1);
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative">
      {/* Hero Banner */}
      <div
        className="relative h-[160px] overflow-hidden rounded-b-[20px] rounded-t-none"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <img
          src={heroImageUrl || instructorHeroImg}
          alt="Driving scene"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/50 to-transparent" />

        {/* Bottom-left text */}
        <div className="absolute bottom-4 left-5 right-5">
          <h1 className="text-[28px] font-bold text-white leading-tight drop-shadow-md">
            {getGreeting()}
          </h1>
          <p className="text-[14px] text-white/70 mt-0.5">
            {format(new Date(), "EEEE d MMMM")}
          </p>
        </div>
      </div>

      {/* Overlapping "This Week" card */}
      <div className="-mt-4 mx-4 relative z-10">
        <div
          className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-[20px] p-4 flex items-center justify-between"
          style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
        >
          {/* Left side */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#0d9488" }}>
              THIS WEEK
            </p>
            <p className="text-[18px] font-semibold text-foreground mt-0.5 leading-snug">
              Keep it moving!
            </p>
            <p className="text-[14px] text-muted-foreground mt-0.5">
              {weeklyLessonsScheduled} lesson{weeklyLessonsScheduled !== 1 ? "s" : ""} scheduled
            </p>
          </div>

          {/* Right side — SVG progress ring */}
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
              <circle
                cx="32" cy="32" r={radius}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={stroke}
                opacity={0.3}
              />
              <motion.circle
                cx="32" cy="32" r={radius}
                fill="none"
                stroke="#0d9488"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[15px] font-bold text-foreground leading-none">
                {completed}/{total}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
