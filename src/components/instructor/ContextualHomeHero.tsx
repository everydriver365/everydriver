import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Clock, 
  MapPin, 
  Car, 
  TrendingUp, 
  Calendar, 
  Sunrise, 
  Sun, 
  Sunset, 
  Moon,
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
  ChevronDown,
  BookOpen,
  MessageCircle,
  Briefcase,
  Eye,
} from "lucide-react";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { haptics } from "@/lib/haptics";
import instructorHeroImg from "@/assets/hero-learner.jpg";

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
    case "CloudRain": case "CloudDrizzle": return "text-primary";
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
  const radius = 25;
  const ringStroke = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;
  const heroGradientColors = clampedProgress >= 80
    ? { start: "#22c55e", end: "#06b6d4" }
    : clampedProgress >= 50
    ? { start: "#eab308", end: "#22c55e" }
    : { start: "#ef4444", end: "#f97316" };
  const heroGlowColor = clampedProgress >= 80 ? "rgba(34,197,94,0.4)" : clampedProgress >= 50 ? "rgba(234,179,8,0.4)" : "rgba(239,68,68,0.4)";

  // Parallax
  const { scrollY } = useScroll();
  const cardY = useTransform(scrollY, [0, 200], [0, -12]);

  // Weekly goal subtitle
  const getSubtitle = () => {
    if (hoursRemaining > 0) {
      return `${hoursRemaining.toFixed(1)} hours remaining of ${hoursGoal}h weekly goal.`;
    }
    return `Weekly goal of ${hoursGoal} hours achieved.`;
  };

  return (
    <div className="relative">
      {/* Hero Image — tall, edge-to-edge */}
      <div className="w-full h-[38vh] min-h-[220px] max-h-[320px] overflow-hidden relative">
        <img
          src={heroImageUrl || instructorHeroImg}
          alt="Hero"
          key={heroImageUrl || "default"}
          className="w-full h-full object-cover"
        />
        {/* Bottom gradient for smooth card overlap */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Overlapping Card */}
      <div className="relative -mt-10 mx-4">
        <div
          className="bg-card dark:bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden"
        >
          <div className="p-4 pb-3">
            {/* Top row: Headline + Ring */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-foreground tracking-tight leading-tight">
                  {getGreeting(firstName, timePeriod)}
                </h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {getSubtitle()}
                </p>

                {/* Weather & Traffic */}
                <div className="flex flex-col gap-1.5 mt-2.5">
                  {currentWeather && currentWeather.temperature !== null && (
                    <div className="flex items-center gap-2">
                      <WeatherIcon
                        icon={currentWeather.icon}
                        className={`h-4 w-4 ${getWeatherIconColor(currentWeather.icon)}`}
                      />
                      <span className="text-sm text-foreground font-medium">
                        {currentWeather.temperature}°C
                      </span>
                      {currentWeather.description && (
                        <span className="text-sm text-muted-foreground capitalize">
                          {currentWeather.description}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {trafficCondition ? (
                      <>
                        <span className={`text-sm font-medium ${
                          trafficCondition === "Heavy" ? "text-destructive" :
                          trafficCondition === "Moderate" ? "text-amber-600 dark:text-amber-400" :
                          "text-emerald-600 dark:text-emerald-400"
                        }`}>
                          {trafficCondition === "Heavy" ? "🔴" : trafficCondition === "Moderate" ? "🟡" : "🟢"} {trafficCondition} traffic
                        </span>
                        {delayMinutes > 0 && (
                          <span className="text-xs text-muted-foreground">
                            (+{delayMinutes} min delay)
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        🚗 No incidents reported
                      </span>
                    )}
                  </div>
                  {unreadMessages > 0 && (
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm text-primary font-medium">
                        {unreadMessages} unread message{unreadMessages !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Circular progress ring */}
              <div className="flex-shrink-0">
                <div className="relative w-[72px] h-[72px]">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                    <defs>
                      <linearGradient id="heroWeeklyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={heroGradientColors.start} />
                        <stop offset="100%" stopColor={heroGradientColors.end} />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="36" cy="36" r={radius}
                      fill="none" stroke="currentColor" strokeWidth={ringStroke}
                      className="text-muted/10"
                    />
                    <motion.circle
                      cx="36" cy="36" r={radius}
                      fill="none" strokeWidth={ringStroke} strokeLinecap="round"
                      stroke="url(#heroWeeklyGrad)"
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      style={{ strokeDasharray: circumference, filter: `drop-shadow(0 0 4px ${heroGlowColor})` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-foreground leading-none">
                      {hoursThisWeek}
                      <span className="text-sm">h</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {clampedProgress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>




          </div>

          {/* Expand toggle */}
          <button
            onClick={() => {
              haptics.selection();
              setIsExpanded(!isExpanded);
            }}
            className="w-full flex justify-center py-1.5 border-t border-border/50 hover:bg-muted/30 transition-colors"
          >
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </button>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
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
                    <div className="flex items-center gap-2 p-2 rounded-2xl bg-primary/5">
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
                    <div className="flex items-center gap-2 p-2 rounded-2xl bg-primary/5">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {todayOverview?.totalHours || 0}h
                        </p>
                        <p className="text-[10px] text-muted-foreground">teaching time</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-2xl bg-emerald-500/5">
                      <PoundSterling className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          £{todayOverview?.expectedEarnings || 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground">expected</p>
                      </div>
                    </div>
                    {weeklyStats && (
                      <div className="flex items-center gap-2 p-2 rounded-2xl bg-violet-500/5">
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
                    <div className="flex items-center gap-2 p-2 rounded-2xl bg-muted/50">
                      <Car className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs text-muted-foreground">
                        {durationText} drive to {nextLesson.pupilName.split(" ")[0]}'s pickup
                      </span>
                    </div>
                  )}

                  {/* Tomorrow */}
                  {tomorrowPreview && tomorrowPreview.lessonCount > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-2xl bg-muted/50">
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
        </div>
      </div>

      {/* Alert indicator */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={`mt-2 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-medium ${
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
