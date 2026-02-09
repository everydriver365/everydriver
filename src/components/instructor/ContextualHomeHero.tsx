import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Clock, 
  MapPin, 
  Car, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
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

// Weather icon component
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
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const timePeriod = getTimePeriod();

  const { durationMinutes, durationText, trafficCondition, delayMinutes } = useTrafficETA(
    nextLesson?.pickupPostcode || null
  );

  // Weekly progress
  const hoursThisWeek = weeklyStats?.hoursThisWeek || 0;
  const hoursGoal = weeklyStats?.hoursGoal || 42;
  const progressPercent = weeklyStats?.progressPercent || 0;
  const clampedProgress = Math.min(progressPercent, 100);
  const hoursRemaining = Math.max(hoursGoal - hoursThisWeek, 0);

  // SVG ring math
  const ringSize = 40;
  const strokeWidth = 3;
  const radius = (ringSize - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className="relative">
      {/* Hero Image with overlaid content */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="relative h-[220px]">
          <img
            src={heroImageUrl || instructorHeroImg}
            alt="Hero"
            key={heroImageUrl || "default"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />

          {/* Top: greeting text (no glass) + ring */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-white drop-shadow-lg">
                {getGreeting(firstName, timePeriod)}
              </h2>
              <p className="text-[10px] text-white/70 drop-shadow mt-0.5">
                {hoursRemaining.toFixed(1)}h to weekly goal
              </p>
            </div>
            {/* Mini circular ring */}
            <div className="relative flex-shrink-0" style={{ width: ringSize, height: ringSize }}>
              <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${ringSize} ${ringSize}`}>
                <circle
                  cx={ringSize / 2} cy={ringSize / 2} r={radius}
                  fill="none" stroke="currentColor" strokeWidth={strokeWidth}
                  className="text-white/20"
                />
                <motion.circle
                  cx={ringSize / 2} cy={ringSize / 2} r={radius}
                  fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
                  className="text-emerald-400"
                  stroke="currentColor"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{ strokeDasharray: circumference }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-bold text-white leading-none drop-shadow">
                  {hoursThisWeek}<span className="text-[8px]">h</span>
                </span>
              </div>
            </div>
          </div>

          {/* Bottom ticker: weather + traffic + messages */}
          <div className="absolute bottom-0 inset-x-0 bg-black/40 backdrop-blur-md px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentWeather && currentWeather.temperature !== null && (
                <>
                  <WeatherIcon
                    icon={currentWeather.icon}
                    className={`h-3.5 w-3.5 ${getWeatherIconColor(currentWeather.icon)}`}
                  />
                  <span className="text-[11px] text-white/80">
                    {currentWeather.temperature}°C
                  </span>
                  <span className="text-white/30">·</span>
                </>
              )}
              {trafficCondition ? (
                <span className={`text-[11px] font-medium ${
                  trafficCondition === "Heavy" ? "text-red-400" :
                  trafficCondition === "Moderate" ? "text-amber-400" :
                  "text-emerald-400"
                }`}>
                  {trafficCondition === "Heavy" ? "🔴" : trafficCondition === "Moderate" ? "🟡" : "🟢"} {trafficCondition}
                </span>
              ) : (
                <span className="text-[11px] text-emerald-400">🟢 Clear</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadMessages > 0 && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3 text-blue-400" />
                  <span className="text-[11px] text-white/80">{unreadMessages}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stat strip below image */}
        <div className="bg-white dark:bg-card border-x border-b border-border grid grid-cols-3 divide-x divide-border/50">
          <div className="py-2.5 text-center">
            <p className="text-sm font-bold text-foreground">{todayOverview?.lessonCount || 0}</p>
            <p className="text-[10px] text-muted-foreground">Lessons</p>
          </div>
          <div className="py-2.5 text-center">
            <p className="text-sm font-bold text-foreground">{todayOverview?.totalHours || 0}h</p>
            <p className="text-[10px] text-muted-foreground">Hours</p>
          </div>
          <div className="py-2.5 text-center">
            <p className="text-sm font-bold text-foreground">£{todayOverview?.expectedEarnings || 0}</p>
            <p className="text-[10px] text-muted-foreground">Expected</p>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => {
            haptics.selection();
            setIsExpanded(!isExpanded);
          }}
          className="w-full flex justify-center py-1.5 bg-white dark:bg-card border-x border-b border-border hover:bg-muted/30 transition-colors rounded-b-2xl"
        >
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden -mt-3 pt-3"
          >
            <div className="bg-white dark:bg-card border border-border rounded-2xl px-4 py-3 space-y-3">
              {/* Status + Location */}
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                  Today's Summary
                </h4>
                <div className="flex items-center gap-2">
                  {displayLocation && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 text-primary" />
                      {displayLocation}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      isGPSConnected
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isGPSConnected ? "bg-emerald-500 animate-pulse" : "bg-destructive"
                      }`}
                    />
                    {isGPSConnected ? "Live" : "Offline"}
                  </span>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {todayOverview?.lessonCount || 0} lessons
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {todayOverview?.completedLessons || 0} completed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {todayOverview?.totalHours || 0}h
                    </p>
                    <p className="text-[10px] text-muted-foreground">teaching time</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5">
                  <PoundSterling className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      £{todayOverview?.expectedEarnings || 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground">expected</p>
                  </div>
                </div>
                {weeklyStats && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-500/5">
                    <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {weeklyStats.progressPercent}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">weekly goal</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Traffic ETA */}
              {durationMinutes > 0 && nextLesson && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Car className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs text-muted-foreground">
                    {durationText} drive to {nextLesson.pupilName.split(" ")[0]}'s pickup
                  </span>
                </div>
              )}

              {/* Tomorrow */}
              {tomorrowPreview && tomorrowPreview.lessonCount > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Tomorrow: {tomorrowPreview.lessonCount} lesson
                    {tomorrowPreview.lessonCount > 1 ? "s" : ""}
                    {tomorrowPreview.firstLessonTime &&
                      ` starting ${tomorrowPreview.firstLessonTime}`}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert indicator */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={`mt-2 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${
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
