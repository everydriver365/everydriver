import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  MapPin,
  Car,
  TrendingUp,
  Calendar,
  PoundSterling,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  Snowflake,
  Wind,
  Sun,
  ChevronDown,
  BookOpen,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import { useTrafficETA } from "@/hooks/useTrafficETA";
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

const WeatherIcon = ({ icon, className }: { icon: string; className?: string }) => {
  const iconMap: Record<string, React.ElementType> = {
    Sun, CloudSun, Cloud, CloudRain, CloudDrizzle, CloudFog, CloudLightning, Snowflake, Wind,
  };
  const IconComponent = iconMap[icon] || Cloud;
  return <IconComponent className={className} />;
};

const getWeatherIconColor = (icon: string): string => {
  switch (icon) {
    case "Sun": return "text-amber-500";
    case "CloudSun": return "text-amber-400";
    case "Cloud": return "text-slate-400";
    case "CloudRain": case "CloudDrizzle": return "text-blue-500";
    case "CloudFog": return "text-slate-500";
    case "CloudLightning": return "text-purple-500";
    case "Snowflake": return "text-sky-400";
    case "Wind": return "text-teal-500";
    default: return "text-slate-400";
  }
};

type TimePeriod = "morning" | "midday" | "evening" | "night";

const getTimePeriod = (): TimePeriod => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "midday";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
};

const getGreeting = (firstName: string, period: TimePeriod) => {
  switch (period) {
    case "morning": return `Ready to teach, ${firstName}?`;
    case "midday": return `Keep going, ${firstName}!`;
    case "evening": return `Great work, ${firstName}!`;
    case "night": return `Ready to teach, ${firstName}?`;
  }
};

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
}: ContextualHomeHeroProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const timePeriod = getTimePeriod();

  const { durationMinutes, durationText, trafficCondition, delayMinutes } = useTrafficETA(
    nextLesson?.pickupPostcode || null
  );

  const hoursThisWeek = weeklyStats?.hoursThisWeek || 0;
  const hoursGoal = weeklyStats?.hoursGoal || 42;
  const progressPercent = weeklyStats?.progressPercent || 0;
  const clampedProgress = Math.min(progressPercent, 100);
  const hoursRemaining = Math.max(hoursGoal - hoursThisWeek, 0);

  return (
    <div className="relative">
      {/* Gradient hero with embedded image */}
      <div className="bg-gradient-to-br from-[#142040] via-[#1e3a6e] to-[#142040] px-4 pt-6 pb-5">
        {/* Top row: Image + Greeting */}
        <div className="flex items-start gap-3">
          {/* Small hero image thumbnail */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden shadow-lg ring-2 ring-white/20">
            <img
              src={heroImageUrl || instructorHeroImg}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white tracking-tight leading-tight">
              {getGreeting(firstName, timePeriod)}
            </h2>

            {/* Context row: Weather + Traffic */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
              {currentWeather && currentWeather.temperature !== null && (
                <span className="flex items-center gap-1 text-sm text-white/80">
                  <WeatherIcon
                    icon={currentWeather.icon}
                    className={`h-3.5 w-3.5 ${getWeatherIconColor(currentWeather.icon)}`}
                  />
                  {currentWeather.temperature}°C
                </span>
              )}
              <span className="text-sm text-white/70">
                {trafficCondition ? (
                  <>
                    {trafficCondition === "Heavy" ? "🔴" : trafficCondition === "Moderate" ? "🟡" : "🟢"}{" "}
                    {trafficCondition}
                  </>
                ) : (
                  "🚗 Clear roads"
                )}
              </span>
              {displayLocation && (
                <span className="flex items-center gap-1 text-xs text-white/50">
                  <MapPin className="h-3 w-3" />
                  {displayLocation}
                </span>
              )}
            </div>
          </div>

          {/* GPS indicator */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mt-0.5 ${
              isGPSConnected
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-red-500/20 text-red-300"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isGPSConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"
              }`}
            />
            {isGPSConnected ? "Live" : "Offline"}
          </span>
        </div>

        {/* Weekly progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-white/70">
              Weekly: {hoursThisWeek}h / {hoursGoal}h
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              {clampedProgress}%
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${clampedProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          {hoursRemaining > 0 && (
            <p className="text-[10px] text-white/40 mt-1">
              {hoursRemaining.toFixed(1)}h remaining
            </p>
          )}
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <p className="text-lg font-bold text-white">{todayOverview?.lessonCount || 0}</p>
            <p className="text-[10px] text-white/50 font-medium">Lessons</p>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <p className="text-lg font-bold text-white">{todayOverview?.totalHours || 0}h</p>
            <p className="text-[10px] text-white/50 font-medium">Hours</p>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <p className="text-lg font-bold text-white">£{todayOverview?.expectedEarnings || 0}</p>
            <p className="text-[10px] text-white/50 font-medium">Expected</p>
          </div>
        </div>

        {/* Unread messages inline */}
        {unreadMessages > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <MessageCircle className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs text-blue-300 font-medium">
              {unreadMessages} unread message{unreadMessages !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Expandable detail section */}
      <div className="bg-card border-b border-border">
        <button
          onClick={() => {
            haptics.selection();
            setIsExpanded(!isExpanded);
          }}
          className="w-full flex items-center justify-center gap-1 py-2 hover:bg-muted/30 transition-colors"
        >
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {isExpanded ? "Less" : "More details"}
          </span>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2">
                {/* Completed lessons */}
                {todayOverview && (todayOverview.completedLessons || 0) > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="text-xs text-foreground">
                      {todayOverview.completedLessons} of {todayOverview.lessonCount} lessons completed
                    </span>
                  </div>
                )}

                {/* Traffic ETA */}
                {durationMinutes > 0 && nextLesson && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Car className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs text-muted-foreground">
                      {durationText} drive to {nextLesson.pupilName.split(" ")[0]}'s pickup
                      {delayMinutes > 0 && ` (+${delayMinutes} min delay)`}
                    </span>
                  </div>
                )}

                {/* Weekly goal detail */}
                {weeklyStats && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-500/5">
                    <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    <span className="text-xs text-muted-foreground">
                      {weeklyStats.progressPercent}% of weekly {hoursGoal}h goal
                    </span>
                  </div>
                )}

                {/* Tomorrow preview */}
                {tomorrowPreview && tomorrowPreview.lessonCount > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Tomorrow: {tomorrowPreview.lessonCount} lesson
                      {tomorrowPreview.lessonCount > 1 ? "s" : ""}
                      {tomorrowPreview.firstLessonTime && ` starting ${tomorrowPreview.firstLessonTime}`}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Alert indicator */}
      {alerts.length > 0 && (
        <div className="px-4 mt-2">
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${
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
        </div>
      )}
    </div>
  );
}
