import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  AlertTriangle,
  Briefcase,
  Eye,
  Menu,
  ChevronDown,
  MapPin,
  Clock,
  PoundSterling,
  BookOpen,
  Calendar,
  Car,
  TrendingUp,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  Snowflake,
  Wind,
  Sun,
} from "lucide-react";
import { haptics } from "@/lib/haptics";
import instructorHeroImg from "@/assets/instructor-hero.jpeg";
import edLogo from "@/assets/ed-black-white-logo.png";

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
  instructorAvatar?: string | null;
  onMenuOpen?: () => void;
}

export function ContextualHomeHero({
  firstName,
  isGPSConnected,
  gpsDeviceName,
  displayLocation,
  currentWeather,
  alerts = [],
  todayOverview,
  tomorrowPreview,
  nextLesson,
  weeklyStats,
  heroImageUrl,
  motivationSubtitle,
  unreadMessages = 0,
  pendingJobs = 0,
  instructorAvatar,
  onMenuOpen,
}: ContextualHomeHeroProps) {
  const navigate = useNavigate();

  // Weekly progress
  const hoursThisWeek = weeklyStats?.hoursThisWeek || 0;
  const hoursGoal = weeklyStats?.hoursGoal || 30;
  const progressPercent = weeklyStats?.progressPercent || 0;
  const hoursRemaining = Math.max(hoursGoal - hoursThisWeek, 0);

  return (
    <div className="relative">
      {/* Full-bleed hero container */}
      <div className="relative w-full" style={{ minHeight: 340 }}>
        {/* Hero image - upper portion */}
        <img
          src={heroImageUrl || instructorHeroImg}
          alt="Hero"
          className="w-full h-full object-cover absolute inset-0"
        />

        {/* Gradient overlay — transparent top, teal-dark bottom */}
        <div 
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, transparent 15%, rgba(74,124,111,0.6) 45%, rgba(45,74,63,0.92) 70%, rgba(35,58,50,0.98) 100%)"
          }}
        />

        {/* Top bar: hamburger, logo, Free badge, avatar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,12px)] pb-2" style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onMenuOpen?.()}
              className="h-9 w-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center"
            >
              <Menu className="h-5 w-5 text-white" />
            </button>
            <img src={edLogo} alt="Every Driver UK" className="h-5 brightness-0 invert" />
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-semibold">
              Free
            </span>
            {instructorAvatar ? (
              <img src={instructorAvatar} alt="" className="h-8 w-8 rounded-full border-2 border-white/30 object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold border-2 border-white/30">
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Stats content — centered in lower portion */}
        <div className="relative z-10 flex flex-col items-center justify-end px-6 pb-6" style={{ minHeight: 340 }}>
          {/* Large hours text */}
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-5xl font-extrabold text-white tracking-tight">{hoursThisWeek}</span>
            <span className="text-2xl font-bold text-white/50">h</span>
            <span className="text-3xl font-light text-white/40 mx-1">/</span>
            <span className="text-3xl font-bold text-white/70">{hoursGoal}</span>
            <span className="text-lg font-bold text-white/40">h</span>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-xs h-2.5 rounded-full bg-white/20 overflow-hidden mb-2">
            <motion.div
              className="h-full rounded-full bg-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPercent, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>

          {/* Subtitle */}
          <p className="text-white/60 text-xs mb-5">
            {hoursRemaining > 0 ? `${hoursRemaining.toFixed(1)} hours remaining` : "Weekly goal achieved! 🎉"}
          </p>

          {/* View offers CTA */}
          {pendingJobs > 0 && (
            <button
              onClick={() => {
                haptics.selection();
                navigate("/instructor/jobs");
              }}
              className="w-full max-w-xs flex items-center justify-center gap-2 h-12 bg-[#142542] text-white text-sm font-semibold rounded-xl active:scale-[0.97] transition-transform shadow-lg"
            >
              <Briefcase className="h-4 w-4" />
              View offers
            </button>
          )}
        </div>
      </div>

      {/* Alert indicator */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={`mx-4 mt-2 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${
            alerts[0].severity === "severe"
              ? "bg-destructive/10 text-destructive"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          }`}
        >
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">
            {alerts[0].severity === "severe"
              ? alerts[0].title
              : `${alerts.length} warning${alerts.length > 1 ? "s" : ""} nearby`}
          </span>
        </motion.div>
      )}
    </div>
  );
}
