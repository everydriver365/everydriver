import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Briefcase, Eye } from "lucide-react";
import { haptics } from "@/lib/haptics";
import instructorHeroImg from "@/assets/instructor-hero.jpeg";

interface ContextualHomeHeroProps {
  firstName: string;
  isGPSConnected: boolean;
  gpsDeviceName?: string | null;
  displayLocation?: string | null;
  currentWeather?: {
    temperature: number | null;
    icon: string;
    description?: string;
  } | null;
  alerts?: { severity: string; title: string }[];
  todayOverview?: {
    lessonCount: number;
    totalHours: number;
    expectedEarnings: number;
    completedLessons?: number;
  } | null;
  tomorrowPreview?: {
    lessonCount: number;
    firstLessonTime?: string;
    firstPickupPostcode?: string;
  } | null;
  nextLesson?: {
    pupilName: string;
    pickupPostcode: string | null;
    startTime: string;
    minutesUntil: number;
  } | null;
  weeklyStats?: {
    hoursThisWeek: number;
    hoursGoal: number;
    progressPercent: number;
  } | null;
  heroImageUrl?: string;
  motivationSubtitle?: string;
  unreadMessages?: number;
  pendingJobs?: number;
}

export function ContextualHomeHero({
  firstName,
  weeklyStats,
  heroImageUrl,
  pendingJobs = 0,
}: ContextualHomeHeroProps) {
  const navigate = useNavigate();

  // Weekly progress data
  const hoursThisWeek = weeklyStats?.hoursThisWeek || 0;
  const hoursGoal = weeklyStats?.hoursGoal || 30;
  const progressPercent = Math.min(weeklyStats?.progressPercent || 0, 100);
  const hoursRemaining = Math.max(hoursGoal - hoursThisWeek, 0);

  return (
    <div className="relative w-full" style={{ height: "30vh", minHeight: 180, maxHeight: 280 }}>
      {/* Full-bleed hero image */}
      <img
        src={heroImageUrl || instructorHeroImg}
        alt="Hero"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Blue-to-dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(30, 64, 175, 0.45) 0%, rgba(30, 64, 175, 0.35) 30%, rgba(15, 23, 42, 0.7) 70%, rgba(15, 23, 42, 0.92) 100%)",
        }}
      />

      {/* Content overlaid on image — pushed to bottom */}
      <div className="absolute inset-0 flex flex-col justify-end px-5 pb-6">
        {/* Greeting */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-white/80 text-sm font-medium mb-1"
        >
          Welcome back, {firstName}
        </motion.p>

        {/* Large hours display */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-3"
        >
          <h1 className="text-white font-bold text-4xl tracking-tight leading-none">
            {hoursThisWeek}h{" "}
            <span className="text-white/50 font-normal text-2xl">/ {hoursGoal}h</span>
          </h1>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-2"
        >
          <div className="w-full h-2.5 rounded-full bg-white/15 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Hours remaining subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-white/60 text-xs font-medium mb-5"
        >
          {hoursRemaining > 0
            ? `${hoursRemaining.toFixed(1)} hours remaining this week`
            : "Weekly goal achieved! 🎉"}
        </motion.p>

        {/* View Offers CTA */}
        {pendingJobs > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            onClick={() => {
              haptics.selection();
              navigate("/instructor/jobs");
            }}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-slate-900/80 backdrop-blur-sm text-white text-sm font-semibold active:scale-[0.97] transition-transform border border-white/10"
          >
            <Briefcase className="h-4 w-4" />
            View offers
          </motion.button>
        )}
      </div>
    </div>
  );
}
