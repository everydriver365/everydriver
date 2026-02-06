import { useState, useEffect } from "react";
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
   BookOpen,
} from "lucide-react";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { haptics } from "@/lib/haptics";

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
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "midday";
  if (hour >= 17 && hour < 21) return "evening";
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
      return `Ready to teach, ${firstName}?`;
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
}: ContextualHomeHeroProps) {
  const [isExpanded, setIsExpanded] = useState(false);
   const [rotatingStatIndex, setRotatingStatIndex] = useState(0);
  const timePeriod = getTimePeriod();
  const TimeIcon = getTimeIcon(timePeriod);
  
  // Get ETA for morning context
  const { durationMinutes, durationText, isLoading: etaLoading } = useTrafficETA(
    timePeriod === "morning" && nextLesson?.pickupPostcode ? nextLesson.pickupPostcode : null
  );

   // Rotating stats for the summary section
   const rotatingStats = [
     todayOverview?.lessonCount !== undefined && {
       icon: BookOpen,
       value: todayOverview.lessonCount,
       label: "lessons today",
       color: "text-violet-600 dark:text-violet-400"
     },
     todayOverview?.totalHours !== undefined && {
       icon: Clock,
       value: todayOverview.totalHours,
       label: "hours today",
       color: "text-blue-600 dark:text-blue-400"
     },
     todayOverview?.expectedEarnings !== undefined && {
       icon: PoundSterling,
       value: todayOverview.expectedEarnings,
       label: "expected",
       color: "text-emerald-600 dark:text-emerald-400"
     },
     weeklyStats && {
       icon: TrendingUp,
       value: weeklyStats.progressPercent,
       label: "% weekly goal",
       color: "text-primary"
     },
   ].filter(Boolean) as Array<{ icon: React.ElementType; value: number; label: string; color: string }>;

   // Auto-rotate stats every 3 seconds
   useEffect(() => {
     if (rotatingStats.length <= 1) return;
     
     const interval = setInterval(() => {
       setRotatingStatIndex((prev) => (prev + 1) % rotatingStats.length);
     }, 3000);
     
     return () => clearInterval(interval);
   }, [rotatingStats.length]);

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

   // Weekly progress for circular indicator
   const weeklyProgress = weeklyStats?.progressPercent || 0;
   const weeklyGoalDays = 6; // Target days per week
   const daysWorked = Math.min(Math.round((weeklyProgress / 100) * weeklyGoalDays), weeklyGoalDays);

  return (
    <div className="relative -mx-4">
      {/* Hero Image - Full Bleed */}
       <div className="w-full h-44 overflow-hidden rounded-2xl border border-border">
        <img 
          src={heroImageUrl || "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800"} 
          alt="Hero" 
          className="w-full h-full object-cover"
        />
      </div>
      
       {/* Overlapping Card - David Lloyd Style */}
       <div className="relative -mt-10 mx-4">
        <motion.div 
            className="bg-white rounded-2xl shadow-xl border border-border cursor-pointer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          onClick={() => {
            haptics.selection();
            handleCardTap();
          }}
          whileTap={{ scale: 0.98 }}
        >
           {/* Main content - David Lloyd layout */}
            <div className="p-4 pb-3">
             {/* Top row: Headline + Circular indicator */}
            <div className="flex items-start justify-between gap-3">
             {/* Left side: Text content */}
             <div className="flex-1 min-w-0">
               {/* Bold headline */}
                <h2 className="text-xl font-bold text-foreground tracking-tight leading-tight">
                  {getGreeting(firstName, timePeriod)}
               </h2>
               
               {/* Subtitle */}
               <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                 {getContextualSubtitle()}
               </p>
             </div>
             
             {/* Right side: Circular progress indicator */}
             <div className="flex-shrink-0">
               <div className="relative w-16 h-16">
                 {/* Background circle */}
                 <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                   <circle
                     cx="32"
                     cy="32"
                     r="28"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="4"
                     className="text-muted/30"
                   />
                   {/* Progress arc */}
                   <circle
                     cx="32"
                     cy="32"
                     r="28"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="4"
                     strokeLinecap="round"
                      className="text-red-500"
                     strokeDasharray={`${(weeklyProgress / 100) * 176} 176`}
                   />
                 </svg>
                 {/* Center text */}
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-blue-600 leading-none">
                     {todayOverview?.lessonCount || 0}
                   </span>
                   <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                     {todayOverview?.lessonCount === 1 ? 'lesson' : 'lessons'}
                   </span>
                 </div>
               </div>
             </div>
           </div>
             
             {/* Location, Weather & Traffic row */}
             <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
               {displayLocation && (
                 <div className="flex items-center gap-1 text-muted-foreground">
                   <MapPin className="h-3 w-3 text-primary" />
                   <span className="text-xs">{displayLocation}</span>
                 </div>
               )}
               {currentWeather && currentWeather.temperature !== null && (
                 <div className="flex items-center gap-1">
                   <WeatherIcon 
                     icon={currentWeather.icon} 
                     className={`h-3.5 w-3.5 ${getWeatherIconColor(currentWeather.icon)}`} 
                   />
                   <span className="text-xs font-medium text-foreground">{currentWeather.temperature}°C</span>
                 </div>
               )}
               {/* Traffic ETA */}
               {durationMinutes > 0 && nextLesson && (
                 <div className="flex items-center gap-1">
                   <Car className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                   <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                     {durationText} to {nextLesson.pupilName.split(' ')[0]}
                   </span>
                 </div>
               )}
             </div>
             
             {/* Rotating Stats Carousel */}
             {rotatingStats.length > 0 && (
               <motion.div 
                 className="flex items-center justify-between mt-3 pt-3 border-t border-border/50"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 0.2 }}
               >
                 <AnimatePresence mode="wait">
                   <motion.div
                     key={rotatingStatIndex}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     transition={{ duration: 0.3 }}
                     className="flex items-center gap-1.5"
                   >
                     {(() => {
                       const stat = rotatingStats[rotatingStatIndex];
                       const StatIcon = stat.icon;
                       return (
                         <>
                           <StatIcon className={`h-4 w-4 ${stat.color}`} />
                           <span className={`text-base font-bold ${stat.color}`}>
                             <AnimatedCounter value={stat.value} />
                           </span>
                           <span className="text-xs text-muted-foreground">{stat.label}</span>
                         </>
                       );
                     })()}
                   </motion.div>
                 </AnimatePresence>
                 
                 {/* Dot indicators */}
                 {rotatingStats.length > 1 && (
                   <div className="flex gap-1">
                     {rotatingStats.map((_, idx) => (
                       <button
                         key={idx}
                         onClick={(e) => {
                           e.stopPropagation();
                           setRotatingStatIndex(idx);
                         }}
                         className={`w-1.5 h-1.5 rounded-full transition-all ${
                           idx === rotatingStatIndex 
                             ? 'bg-primary w-3' 
                             : 'bg-muted-foreground/30'
                         }`}
                       />
                     ))}
                   </div>
                 )}
               </motion.div>
             )}
           </div>
            
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
                   <div className="px-5 pb-5 pt-0 border-t border-border/50 space-y-3">
                     <div className="flex items-center justify-between pt-3">
                       <h4 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Today's Summary</h4>
                       <div className="flex items-center gap-1">
                         <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                           isGPSConnected 
                             ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                             : 'bg-destructive/10 text-destructive'
                         }`}>
                           <span className={`w-1.5 h-1.5 rounded-full ${isGPSConnected ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'}`} />
                           {isGPSConnected ? 'Live' : 'Offline'}
                         </span>
                         <motion.div
                           animate={{ rotate: isExpanded ? 180 : 0 }}
                           transition={{ duration: 0.2 }}
                         >
                           <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                         </motion.div>
                       </div>
                     </div>
                    
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
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {todayOverview?.totalHours || 0}h
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            teaching time
                          </p>
                        </div>
                      </div>
                      
                      {/* Earnings */}
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5">
                        <PoundSterling className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            £{todayOverview?.expectedEarnings || 0}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            expected
                          </p>
                        </div>
                      </div>
                      
                      {/* Weekly Progress */}
                      {weeklyStats && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-500/5">
                          <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {weeklyStats.progressPercent}%
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              weekly goal
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Tomorrow Preview */}
                    {tomorrowPreview && tomorrowPreview.lessonCount > 0 && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 mt-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Tomorrow: {tomorrowPreview.lessonCount} lesson{tomorrowPreview.lessonCount > 1 ? 's' : ''} 
                          {tomorrowPreview.firstLessonTime && ` starting ${tomorrowPreview.firstLessonTime}`}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </motion.div>
      </div>
      
      {/* Alert indicator (if alerts exist) */}
      {alerts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={`mx-4 mt-2 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${
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
    </div>
  );
}
