import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  BookOpen
} from "lucide-react";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { haptics } from "@/lib/haptics";

interface ContextualHomeHeroProps {
  firstName: string;
  isGPSConnected: boolean;
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
}

// Weather icon component
const WeatherIcon = ({ icon, className }: { icon: string; className?: string }) => {
  const iconMap: Record<string, React.ElementType> = {
    Sun,
    CloudSun,
    Cloud,
    CloudRain,
    CloudDrizzle,
    CloudFog,
    CloudLightning,
    Snowflake,
    Wind,
  };
  const IconComponent = iconMap[icon] || Cloud;
  return <IconComponent className={className} />;
};

// Get weather icon color based on type
const getWeatherIconColor = (icon: string): string => {
  switch (icon) {
    case "Sun":
      return "text-amber-500";
    case "CloudSun":
      return "text-amber-400";
    case "Cloud":
      return "text-slate-400";
    case "CloudRain":
    case "CloudDrizzle":
      return "text-blue-500";
    case "CloudFog":
      return "text-slate-500";
    case "CloudLightning":
      return "text-purple-500";
    case "Snowflake":
      return "text-sky-400";
    case "Wind":
      return "text-teal-500";
    default:
      return "text-slate-400";
  }
};

// Get time period for contextual content
type TimePeriod = "morning" | "midday" | "evening" | "night";

const getTimePeriod = (): TimePeriod => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return "morning";
  if (hour >= 10 && hour < 16) return "midday";
  if (hour >= 16 && hour < 21) return "evening";
  return "night";
};

const getTimeIcon = (period: TimePeriod) => {
  switch (period) {
    case "morning":
      return Sunrise;
    case "midday":
      return Sun;
    case "evening":
      return Sunset;
    case "night":
      return Moon;
  }
};

const getGreeting = (firstName: string, period: TimePeriod) => {
  switch (period) {
    case "morning":
      return `Good morning, ${firstName}!`;
    case "midday":
      return `Good afternoon, ${firstName}!`;
    case "evening":
      return `Good evening, ${firstName}!`;
    case "night":
      return `Ready to plan, ${firstName}?`;
  }
};

export function ContextualHomeHero({
  firstName,
  isGPSConnected,
  displayLocation,
  currentWeather,
  alerts = [],
  todayOverview,
  tomorrowPreview,
  nextLesson,
  weeklyStats,
  heroImageUrl,
  motivationSubtitle,
}: ContextualHomeHeroProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const timePeriod = getTimePeriod();
  const TimeIcon = getTimeIcon(timePeriod);
  
  // Get ETA for morning context
  const { durationMinutes, durationText, isLoading: etaLoading } = useTrafficETA(
    timePeriod === "morning" && nextLesson?.pickupPostcode ? nextLesson.pickupPostcode : null
  );

  const handleCardTap = () => {
    setIsExpanded(!isExpanded);
  };

  // Contextual subtitle based on time of day
  const getContextualSubtitle = () => {
    const completedLessons = todayOverview?.completedLessons || 0;
    const totalLessons = todayOverview?.lessonCount || 0;
    const remainingLessons = totalLessons - completedLessons;
    
    switch (timePeriod) {
      case "morning":
        if (nextLesson && durationMinutes > 0) {
          return `${durationText} drive to ${nextLesson.pupilName}'s pickup`;
        }
        if (totalLessons > 0) {
          return `${totalLessons} lesson${totalLessons > 1 ? 's' : ''} scheduled today`;
        }
        return motivationSubtitle || "Ready for a great day!";
        
      case "midday":
        if (remainingLessons > 0) {
          return `${completedLessons} done, ${remainingLessons} to go · £${todayOverview?.expectedEarnings || 0} expected`;
        }
        if (completedLessons > 0) {
          return `All ${completedLessons} lessons complete! £${todayOverview?.expectedEarnings || 0} earned`;
        }
        return motivationSubtitle || "Enjoy your day!";
        
      case "evening":
        if (totalLessons > 0) {
          return `Great work! ${totalLessons} lessons · £${todayOverview?.expectedEarnings || 0} earned`;
        }
        if (tomorrowPreview && tomorrowPreview.lessonCount > 0) {
          return `Tomorrow: ${tomorrowPreview.lessonCount} lessons starting ${tomorrowPreview.firstLessonTime || 'early'}`;
        }
        return "Rest up for tomorrow!";
        
      case "night":
        if (tomorrowPreview && tomorrowPreview.lessonCount > 0) {
          return `Tomorrow: ${tomorrowPreview.lessonCount} lessons at ${tomorrowPreview.firstLessonTime || 'scheduled times'}`;
        }
        if (weeklyStats) {
          const hoursRemaining = weeklyStats.hoursGoal - weeklyStats.hoursThisWeek;
          if (hoursRemaining > 0) {
            return `${hoursRemaining.toFixed(1)}h to weekly goal (${weeklyStats.progressPercent}%)`;
          }
          return `Weekly goal achieved! ${weeklyStats.hoursThisWeek}h logged`;
        }
        return "Plan ahead for success!";
    }
  };

  // Contextual stat card content
  const getContextualStats = () => {
    switch (timePeriod) {
      case "morning":
        return {
          primary: {
            icon: Clock,
            value: nextLesson ? nextLesson.minutesUntil : todayOverview?.totalHours || 0,
            label: nextLesson ? "min until first" : "hours today",
            color: "text-primary"
          },
          secondary: durationMinutes > 0 ? {
            icon: Car,
            value: durationMinutes,
            label: "min drive",
            color: "text-emerald-600 dark:text-emerald-400"
          } : null
        };
        
      case "midday":
        const completedLessons = todayOverview?.completedLessons || 0;
        const totalLessons = todayOverview?.lessonCount || 0;
        return {
          primary: {
            icon: TrendingUp,
            value: completedLessons,
            label: `of ${totalLessons} done`,
            color: "text-primary"
          },
          secondary: {
            icon: PoundSterling,
            value: todayOverview?.expectedEarnings || 0,
            label: "expected",
            color: "text-emerald-600 dark:text-emerald-400"
          }
        };
        
      case "evening":
        return {
          primary: {
            icon: PoundSterling,
            value: todayOverview?.expectedEarnings || 0,
            label: "earned today",
            color: "text-emerald-600 dark:text-emerald-400"
          },
          secondary: tomorrowPreview ? {
            icon: Calendar,
            value: tomorrowPreview.lessonCount,
            label: "tomorrow",
            color: "text-primary"
          } : null
        };
        
      case "night":
        return {
          primary: weeklyStats ? {
            icon: TrendingUp,
            value: weeklyStats.progressPercent,
            label: "% weekly goal",
            color: "text-primary"
          } : {
            icon: Calendar,
            value: tomorrowPreview?.lessonCount || 0,
            label: "tomorrow",
            color: "text-primary"
          },
          secondary: null
        };
    }
  };

  const stats = getContextualStats();

  return (
    <div className="relative">
      {/* Hero Image */}
      <div className="w-full h-56 overflow-hidden">
        <img 
          src={heroImageUrl || "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800"} 
          alt="Hero" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Overlapping Contextual Card - Tappable */}
      <div className="relative -mt-16 mx-3">
        <motion.div 
          className="glass-strong rounded-2xl shadow-lg p-4 cursor-pointer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          onClick={() => {
            haptics.selection();
            handleCardTap();
          }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Row 1: TODAY label + Status + Time Icon + Expand indicator */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-muted-foreground tracking-wide">TODAY</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
              isGPSConnected 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                : 'bg-destructive/10 text-destructive'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isGPSConnected ? 'bg-emerald-500' : 'bg-destructive'}`} />
              {isGPSConnected ? 'Live' : 'Offline'}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <TimeIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </motion.div>
            </div>
          </div>
          
          {/* Row 2: Greeting */}
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            {getGreeting(firstName, timePeriod)}
          </h1>
          
          {/* Row 3: Location + Weather */}
          <div className="flex items-center justify-between gap-2 mt-0.5">
            {displayLocation ? (
              <div className="flex items-center gap-1 text-muted-foreground min-w-0">
                <MapPin className="h-3 w-3 flex-shrink-0 text-primary" />
                <span className="text-xs truncate">{displayLocation}</span>
              </div>
            ) : (
              <div />
            )}
            
            {/* Weather display with colored icon */}
            {currentWeather && currentWeather.temperature !== null && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <WeatherIcon 
                  icon={currentWeather.icon} 
                  className={`h-4 w-4 ${getWeatherIconColor(currentWeather.icon)}`} 
                />
                <span className="text-sm font-medium text-foreground">{currentWeather.temperature}°C</span>
              </div>
            )}
          </div>
          
          {/* Row 4: Contextual Subtitle with animation */}
          <AnimatePresence mode="wait">
            <motion.p 
              key={timePeriod}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-muted-foreground text-xs leading-relaxed mt-1 line-clamp-2"
            >
              {getContextualSubtitle()}
            </motion.p>
          </AnimatePresence>
          
          {/* Row 5: Contextual Stats */}
          {stats.primary && (
            <motion.div 
              className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-1.5">
                <stats.primary.icon className={`h-4 w-4 ${stats.primary.color}`} />
                <span className={`text-base font-bold ${stats.primary.color}`}>
                  <AnimatedCounter value={stats.primary.value} />
                </span>
                <span className="text-xs text-muted-foreground">{stats.primary.label}</span>
              </div>
              
              {stats.secondary && (
                <>
                  <div className="w-px h-5 bg-border/50" />
                  <div className="flex items-center gap-1.5">
                    <stats.secondary.icon className={`h-4 w-4 ${stats.secondary.color}`} />
                    <span className={`text-base font-bold ${stats.secondary.color}`}>
                      <AnimatedCounter value={stats.secondary.value} />
                    </span>
                    <span className="text-xs text-muted-foreground">{stats.secondary.label}</span>
                  </div>
                </>
              )}
            </motion.div>
          )}
          
          {/* Expanded Content - Today's Summary */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground tracking-wide">TODAY'S SUMMARY</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {/* Lessons */}
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
                    
                    {/* Hours */}
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {todayOverview?.totalHours || 0}h scheduled
                        </p>
                        <p className="text-[10px] text-muted-foreground">driving today</p>
                      </div>
                    </div>
                    
                    {/* Earnings */}
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5">
                      <PoundSterling className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          £{todayOverview?.expectedEarnings || 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground">expected</p>
                      </div>
                    </div>
                    
                    {/* Tomorrow Preview */}
                    {tomorrowPreview && tomorrowPreview.lessonCount > 0 && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {tomorrowPreview.lessonCount} tomorrow
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            starts {tomorrowPreview.firstLessonTime || 'TBD'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Weekly Progress if available */}
                  {weeklyStats && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">Weekly goal</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {weeklyStats.progressPercent}% ({weeklyStats.hoursThisWeek}h of {weeklyStats.hoursGoal}h)
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Row 6: Compact Alert Indicator (if alerts exist) */}
          {alerts.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className={`flex items-center gap-1.5 mt-2 px-2 py-1 rounded-md text-xs font-medium ${
                alerts[0].severity === 'severe' 
                  ? 'bg-destructive/10 text-destructive' 
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}
            >
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {alerts[0].severity === 'severe' 
                  ? alerts[0].title 
                  : `${alerts.length} warning${alerts.length > 1 ? 's' : ''} nearby`}
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
