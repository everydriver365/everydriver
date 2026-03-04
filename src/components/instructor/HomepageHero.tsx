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
          className="bg-white dark:bg-card backdrop-blur-md rounded-2xl p-3.5 flex items-center justify-between"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              THIS WEEK
            </p>
            <p className="text-[17px] font-semibold text-foreground mt-0.5 leading-snug">
              Keep it moving!
            </p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {weeklyLessonsScheduled} lesson{weeklyLessonsScheduled !== 1 ? "s" : ""} scheduled
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
