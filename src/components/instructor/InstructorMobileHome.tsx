import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Play,
  Clock,
  PoundSterling,
  MapPin,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  Snowflake,
  Wind,
  AlertTriangle,
  X,
  LayoutGrid,
  Sun,
  BookOpen,
  ChevronRight,
  CheckCircle,
  Calendar,
  Mail,
  Target,
  Timer,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";

import { useInstructorHomepageContent } from "@/hooks/useInstructorHomepageContent";
import { useGPSConnectionStatus } from "@/hooks/useGPSConnectionStatus";

import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useDrivingAlerts } from "@/hooks/useDrivingAlerts";
import { useInstructorStreak } from "@/hooks/useInstructorStreak";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { useTomorrowPreview } from "@/hooks/useTomorrowPreview";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { useLastWeekComparison } from "@/hooks/useLastWeekComparison";
import { useInstructorLastPosition } from "@/hooks/useInstructorLastPosition";

import { useUrgentAlerts } from "@/hooks/useUrgentAlerts";
import { QuickActionTiles } from "@/components/instructor/QuickActionTiles";
import { SmartRemindersCard } from "@/components/instructor/SmartRemindersCard";
import { InstructorSetupChecklist } from "@/components/instructor/InstructorSetupChecklist";
import { PlanWidget } from "@/components/instructor/dashboard/PlanWidget";
import { UnifiedAgendaTile } from "@/components/instructor/dashboard/UnifiedAgendaTile";
import { ReferralStatsWidget } from "@/components/instructor/dashboard/ReferralStatsWidget";
import { NextUpTile } from "@/components/instructor/NextUpTile";
import planAheadIcon from "@/assets/plan-ahead-icon.png";
import { DrivingAlertsStrip } from "@/components/instructor/DrivingAlertsStrip";
import { VehicleHealthStrip } from "@/components/instructor/VehicleHealthStrip";
import { WeeklyGoalRing } from "@/components/instructor/WeeklyGoalRing";
import { TrackerReminderBanner } from "@/components/instructor/TrackerReminderBanner";

import { ContextualHomeHero } from "@/components/instructor/ContextualHomeHero";
import { ReadyToTeachTile } from "@/components/instructor/ReadyToTeachTile";
import instructorHeroImg from "@/assets/instructor-hero.jpeg";
import jobOffersIcon from "@/assets/job-offers-icon.png";
import messagesIcon from "@/assets/messages-icon.png";
import testRequestsIcon from "@/assets/test-requests-icon.png";
import { RadialFAB } from "@/components/instructor/RadialFAB";
import { UrgentAlertOverlay } from "@/components/instructor/UrgentAlertOverlay";
import { TodayRoutePreview } from "@/components/instructor/TodayRoutePreview";
import { GapFillerCard } from "@/components/instructor/GapFillerCard";
import { CelebrationConfetti } from "@/components/instructor/CelebrationConfetti";
import { QuietDayEmpty } from "@/components/instructor/QuietDayEmpty";
import { HomePageSkeleton } from "@/components/instructor/HomePageSkeleton";
import { AppStyleHomeView } from "@/components/instructor/AppStyleHomeView";
import { LockScreenHomeView } from "@/components/instructor/LockScreenHomeView";
import { CleanHomeView } from "@/components/instructor/CleanHomeView";
import { TodayMiniTimeline } from "@/components/instructor/TodayMiniTimeline";
import { TomorrowPeekCard } from "@/components/instructor/TomorrowPeekCard";
import { RoadAlertsRow } from "@/components/instructor/RoadAlertsRow";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { QuickStatsChips } from "@/components/instructor/QuickStatsChips";
import { EmptyState } from "@/components/ui/EmptyState";
import { FloatingSessionBar } from "@/components/instructor/FloatingSessionBar";
import { TestRequestsTile } from "@/components/instructor/TestRequestsTile";
import { WeatherWidget } from "@/components/instructor/WeatherWidget";
import { CardSection } from "@/components/ui/CardSection";
import { GlassCard } from "@/components/ui/GlassCard";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useTheme } from "@/context/ThemeContext";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { triggerHaptic } from "@/lib/haptics";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { useInstructorAppearance } from "@/hooks/useInstructorAppearance";

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
      return "text-primary";
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

interface InstructorMobileHomeProps {
  instructor: {
    id?: string;
    name: string;
    profile_image_url: string | null;
    is_active?: boolean;
    payment_qr_url?: string | null;
  } | null;
  todaysLessonCount: number;
  onPaymentClick: () => void;
}

// Time-aware greeting helper
const getGreeting = (firstName: string) => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `Good morning, ${firstName}!`;
  if (hour >= 12 && hour < 17) return `Good afternoon, ${firstName}!`;
  if (hour >= 17 && hour < 21) return `Good evening, ${firstName}!`;
  return `Ready to teach, ${firstName}?`;
};

export function InstructorMobileHome({ 
  instructor, 
  todaysLessonCount,
  onPaymentClick 
}: InstructorMobileHomeProps) {
  const pendingJobsCount = usePendingJobsCount();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setTheme } = useTheme();
  const { instructor: authInstructor } = useInstructorAuth();
  const [isTileEditMode, setIsTileEditMode] = useState(false);
  const [showFAB, setShowFAB] = useState(false);
  const [showRefreshFeedback, setShowRefreshFeedback] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { content, loading: contentLoading } = useInstructorHomepageContent();
  const [searchParams, setSearchParams] = useSearchParams();

  // Listen for editTiles URL parameter
  useEffect(() => {
    if (searchParams.get("editTiles") === "true") {
      setIsTileEditMode(true);
      // Clear the param from URL
      searchParams.delete("editTiles");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Use auth context for instructor ID
  const instructorId = authInstructor?.id || instructor?.id;
  
  // Appearance preferences (layout, wallpaper, hero)
  const { layoutStyle, wallpaperColor, heroImageUrl: personalHeroUrl } = useInstructorAppearance(instructorId);
  
  // GPS connection status and today's overview
  const { 
    isConnected: isGPSConnected, 
    deviceName: gpsDeviceName,
    isStationary: isGPSStationary,
    manualReconnect: manualGPSReconnect 
  } = useGPSConnectionStatus(instructorId || null);
  
  // Server-side geotab-poller handles polling automatically via pg_cron
  const isGPSReconnecting = false;
  const gpsRetryCount = 0;
  const triggerManualReconnect = manualGPSReconnect;

  const { data: todayOverview, isLoading: todayLoading } = useTodayOverview(instructorId);
  const { data: nextLesson } = useNextLessonDetails(instructorId);
  const { data: unreadCount } = useUnreadMessagesCount(instructorId);
  const { total: combinedNotifCount, messageCount: pupilMsgCount, pendingJobsCount: notifJobCount, swapCount: testSwapCount, visitorChatCount } = useCombinedNotificationCount(instructorId);
  const { alerts, dismissAlert, location: alertsLocation, currentWeather } = useDrivingAlerts(instructorId);
  const { roadName: gpsRoadName } = useInstructorLastPosition(instructorId || null);
  
  // New enhancement hooks
  const { data: streak } = useInstructorStreak(instructorId);
  const { data: weeklyGoals } = useWeeklyGoals(instructorId);
  const { data: tomorrowPreview } = useTomorrowPreview(instructorId);
  const { data: gapSuggestions } = useRealGapSlots(instructorId);
  const { data: todayLessons } = useTodayRemainingLessons(instructorId);
  
  // Derive display location - prefer GPS road name, fallback to alerts location
  const displayLocation = gpsRoadName || alertsLocation;
  const { data: lastWeekComparison } = useLastWeekComparison(instructorId);
  // Initialize offline caching for schedules and pupils
  const { cacheSchedules, cachePupils } = useOfflineSync({ instructorId });
  
  useEffect(() => {
    if (instructorId && navigator.onLine) {
      cacheSchedules();
      cachePupils();
    }
  }, [instructorId, cacheSchedules, cachePupils]);

  const { alerts: urgentAlerts, dismissAlert: dismissUrgentAlert } = useUrgentAlerts(instructorId);
  const { devices: vehicleDevices } = useVehicleHealth();
  const engineFaultCount = vehicleDevices.flatMap(d => d.last_fault_codes || []).length;
  const [engineFaultsDismissed, setEngineFaultsDismissed] = useState(() => {
    const ts = localStorage.getItem("engine_faults_dismissed_at");
    if (!ts) return false;
    return Date.now() - parseInt(ts) < 24 * 60 * 60 * 1000;
  });

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const firstName = instructor?.name?.split(" ")[0] || "Instructor";
  
  // Calculate max lessons for progress (default 6 if no data)
  const maxLessons = 6;
  const currentLessons = todayOverview?.lessonCount || todaysLessonCount || 0;

  // Detect day completion for confetti (simplified - trigger when all lessons for day are done)
  useEffect(() => {
    // We'll use a simple heuristic: if it's evening and there are lessons, celebrate
    const hour = new Date().getHours();
    if (todayOverview && todayOverview.lessonCount > 0 && hour >= 18) {
      const today = new Date().toDateString();
      const lastCelebration = localStorage.getItem("last-celebration-date");
      if (lastCelebration !== today) {
        setShowConfetti(true);
        triggerHaptic("success");
        localStorage.setItem("last-celebration-date", today);
      }
    }
  }, [todayOverview]);

  // Scroll detection for FAB
  useEffect(() => {
    const handleScroll = () => {
      setShowFAB(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Pull to refresh handler
  const handleRefresh = async () => {
    triggerHaptic("light");
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["today-overview"] }),
      queryClient.invalidateQueries({ queryKey: ["next-lesson-details"] }),
      queryClient.invalidateQueries({ queryKey: ["instructor-homepage-content"] }),
      queryClient.invalidateQueries({ queryKey: ["unread-messages-count"] }),
      queryClient.invalidateQueries({ queryKey: ["instructor-streak"] }),
      queryClient.invalidateQueries({ queryKey: ["weekly-goals"] }),
      queryClient.invalidateQueries({ queryKey: ["tomorrow-preview"] }),
      queryClient.invalidateQueries({ queryKey: ["gap-suggestions"] }),
      queryClient.invalidateQueries({ queryKey: ["last-week-comparison"] }),
    ]);
    setShowRefreshFeedback(true);
    setTimeout(() => setShowRefreshFeedback(false), 1500);
  };

  // Show skeleton while loading critical data
  if (contentLoading && !content) {
    return <HomePageSkeleton />;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
       <UrgentAlertOverlay alerts={urgentAlerts} onDismiss={dismissUrgentAlert} />
       <div
         className="min-h-screen flex flex-col overflow-x-hidden relative"
         style={{ backgroundColor: wallpaperColor || undefined }}
       >

      {/* Updated feedback banner */}
      <AnimatePresence>
        {showRefreshFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-center pt-2"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-medium">
              <CheckCircle className="h-3 w-3" />
              Updated just now
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* App Style layout: iOS launcher (replaces entire page content) */}
      {layoutStyle === "schedule" ? (
        <AppStyleHomeView
          instructorId={instructorId}
          heroImageUrl={personalHeroUrl || content?.hero_image_url}
          wallpaperColor={wallpaperColor}
          profileImageUrl={instructor?.profile_image_url}
        />
      ) : layoutStyle === "lockscreen" ? (
        <LockScreenHomeView
          instructorId={instructorId}
          instructor={instructor}
          todayOverview={todayOverview}
          nextLesson={nextLesson}
          weeklyGoals={weeklyGoals}
          streak={streak}
          pendingJobsCount={pendingJobsCount}
          pupilMsgCount={pupilMsgCount}
          alerts={alerts}
          dismissAlert={dismissAlert}
          alertsLocation={alertsLocation}
          currentWeather={currentWeather}
          isGPSConnected={isGPSConnected}
          todayLessons={todayLessons}
          tomorrowPreview={tomorrowPreview}
          content={content}
          contentLoading={contentLoading}
          isTileEditMode={isTileEditMode}
          onTileEditModeChange={setIsTileEditMode}
          authInstructorId={authInstructor?.id}
        />
      ) : layoutStyle === "clean" ? (
        <CleanHomeView
          instructorId={instructorId}
          instructor={instructor}
          todayOverview={todayOverview}
          todayLessons={todayLessons}
        />
      ) : (
      <>
      {/* Hero Image + Greeting + Today's Overview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative"
      >
        {/* Hero Image */}
        <div className="relative h-[220px] overflow-hidden">
          <img
            src={content?.hero_image_url || instructorHeroImg}
            alt="Instructor hero"
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay at bottom for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {/* Greeting text overlaid at bottom of image */}
          <div className="absolute bottom-10 left-5 right-5 text-white">
            <h1 className="text-[26px] font-bold leading-tight drop-shadow-sm">
              {(() => {
                const h = new Date().getHours();
                if (h >= 5 && h < 12) return "Good Morning";
                if (h >= 12 && h < 17) return "Good Afternoon";
                if (h >= 17 && h < 21) return "Good Evening";
                return "Hello";
              })()}{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="text-white/80 text-[15px] mt-0.5 drop-shadow-sm">
              {format(new Date(), "EEEE d MMMM")}
            </p>
          </div>
        </div>

        {/* Sticky next-up bar */}
        <AnimatePresence>
          {showFAB && nextLesson && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-0 left-0 right-0 z-50 bg-primary text-white px-4 py-2 flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Timer className="h-3.5 w-3.5 shrink-0" />
                <span className="text-sm font-semibold truncate">{nextLesson.pupilName}</span>
              </div>
              <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full shrink-0">
                {nextLesson.minutesUntil <= 0 ? "Now" : nextLesson.minutesUntil < 60 ? `${nextLesson.minutesUntil}m` : `${Math.floor(nextLesson.minutesUntil / 60)}h ${nextLesson.minutesUntil % 60}m`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Today's Overview card — overlapping the hero */}
        <div className="px-4 -mt-8 relative z-10">
          <motion.div
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] overflow-hidden"
          >
            <button
              onClick={() => navigate("/instructor/schedule")}
              className="w-full bg-gradient-to-r from-primary via-primary to-primary/90 p-4 flex items-center gap-4 text-left"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.12em]">Today's Overview</p>
                  {currentWeather && (
                    <span className="flex items-center gap-1 text-amber-300 text-[11px]">
                      {(() => {
                        const WeatherIcon = currentWeather.icon === "Sun" ? Sun
                          : currentWeather.icon === "CloudSun" ? CloudSun
                          : currentWeather.icon === "Cloud" ? Cloud
                          : currentWeather.icon === "CloudRain" ? CloudRain
                          : currentWeather.icon === "CloudDrizzle" ? CloudDrizzle
                          : currentWeather.icon === "CloudLightning" ? CloudLightning
                          : currentWeather.icon === "CloudFog" ? CloudFog
                          : currentWeather.icon === "Snowflake" ? Snowflake
                          : currentWeather.icon === "Wind" ? Wind
                          : CloudSun;
                        const iconColor = currentWeather.icon === "Sun" ? "text-yellow-400"
                          : currentWeather.icon === "CloudSun" ? "text-amber-400"
                          : currentWeather.icon === "CloudRain" ? "text-blue-400"
                          : currentWeather.icon === "CloudDrizzle" ? "text-sky-400"
                          : currentWeather.icon === "CloudLightning" ? "text-violet-400"
                          : currentWeather.icon === "Snowflake" ? "text-cyan-300"
                          : currentWeather.icon === "Wind" ? "text-teal-300"
                          : currentWeather.icon === "CloudFog" ? "text-gray-300"
                          : "text-amber-300";
                        return <WeatherIcon className={`h-3.5 w-3.5 ${iconColor}`} />;
                      })()}
                      {currentWeather.temperature != null && `${Math.round(currentWeather.temperature)}°C`}
                      {displayLocation && (
                        <>
                          <span className="text-white/40 mx-0.5">·</span>
                          <MapPin className="h-2.5 w-2.5" />
                          <span className="max-w-[100px] truncate">{displayLocation}</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
                <p className="text-[15px] font-semibold text-white mt-1.5 leading-snug">
                  {todayOverview?.lessonCount
                    ? `${todayOverview.lessonCount} lesson${todayOverview.lessonCount > 1 ? "s" : ""} lined up today.`
                    : "No lessons scheduled today."}
                </p>
                {todayOverview && todayOverview.lessonCount > 0 && (
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-white/70 text-[12px] flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {todayOverview.totalHours}h
                    </span>
                    <span className="text-white/70 text-[12px] flex items-center gap-1">
                      <PoundSterling className="h-3 w-3" />
                      £{todayOverview.expectedEarnings}
                      {lastWeekComparison && lastWeekComparison.percentChange !== 0 && (
                        <span className={`ml-1 text-[10px] font-bold ${lastWeekComparison.percentChange > 0 ? "text-emerald-300" : "text-red-300"}`}>
                          {lastWeekComparison.percentChange > 0 ? "▲" : "▼"}{Math.abs(lastWeekComparison.percentChange)}%
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
              {/* Lesson Count Ring */}
              <div className="flex items-center gap-2 shrink-0">
                {(() => {
                  const total = maxLessons;
                  const done = todayOverview?.lessonCount || 0;
                  const pct = Math.min(done / total, 1);
                  const r = 22;
                  const circ = 2 * Math.PI * r;
                  const offset = circ * (1 - pct);
                  return (
                    <div className="relative w-14 h-14 shrink-0">
                      <svg viewBox="0 0 52 52" className="w-full h-full -rotate-90">
                        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                        <motion.circle
                          cx="26" cy="26" r={r} fill="none"
                          stroke="white" strokeWidth="4" strokeLinecap="round"
                          strokeDasharray={circ}
                          initial={{ strokeDashoffset: circ }}
                          animate={{ strokeDashoffset: offset }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-black text-white leading-none">{done}</span>
                        <span className="text-[7px] font-bold text-white/80 uppercase leading-none mt-0.5 tracking-wider">Today</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </button>
            {/* Engine fault warning line */}
            {engineFaultCount > 0 && !engineFaultsDismissed && (
              <div className="w-full flex items-center bg-destructive/90 text-white">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate("/instructor/vehicle-health#faults"); }}
                  className="flex-1 flex items-center gap-2 px-4 py-2.5 text-left active:bg-destructive transition-colors"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[12px] font-medium flex-1">
                    {engineFaultCount} engine fault{engineFaultCount > 1 ? "s" : ""} detected — tap to view
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-white/60 shrink-0" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    localStorage.setItem("engine_faults_dismissed_at", Date.now().toString());
                    setEngineFaultsDismissed(true);
                  }}
                  className="px-3 py-2.5 hover:bg-white/10 active:bg-white/20 transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-white/70" />
                </button>
              </div>
            )}
            {/* Weather warning line */}
            {currentWeather && currentWeather.temperature != null && currentWeather.temperature <= 2 && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate("/instructor/road-alerts"); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white text-left active:bg-sky-700 transition-colors"
              >
                <Snowflake className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[12px] font-medium flex-1">
                  Ice risk — {currentWeather.temperature}°C{currentWeather.description ? ` · ${currentWeather.description}` : ""}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-white/60 shrink-0" />
              </button>
            )}
            {currentWeather && currentWeather.temperature != null && currentWeather.temperature > 2 && (currentWeather.icon === "CloudRain" || currentWeather.icon === "CloudLightning" || currentWeather.icon === "CloudDrizzle") && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate("/instructor/road-alerts"); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-primary/80 text-white text-left active:bg-primary/90 transition-colors"
              >
                <WeatherIcon icon={currentWeather.icon} className="h-3.5 w-3.5 shrink-0 text-white" />
                <span className="text-[12px] font-medium flex-1">
                  Weather alert — {currentWeather.temperature}°C · {currentWeather.description || "Rain expected"}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-white/60 shrink-0" />
              </button>
            )}
            {/* Road closure / traffic alerts line */}
            {alerts.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate("/instructor/road-alerts"); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-left active:bg-amber-700 transition-colors"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[12px] font-medium flex-1">
                  {alerts.length} road alert{alerts.length > 1 ? "s" : ""} nearby — tap to view
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-white/60 shrink-0" />
              </button>
            )}
          </motion.div>
        </div>
      </motion.div>
      {/* Notifications — reference-image style vertical list */}
      <div className="px-4 mt-3 space-y-3">
        {/* Job Offers */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/instructor/jobs")}
          className="w-full rounded-2xl px-4 py-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.05)] border border-border/40 bg-card flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-500/12 flex items-center justify-center shrink-0 overflow-hidden">
            <img src={jobOffersIcon} alt="Job Offers" className="w-full h-full object-cover" style={{ borderRadius: '7px' }} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-foreground leading-tight">Job Offers</p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">Browse available positions</p>
          </div>
          <span className="min-w-[28px] h-7 px-2 rounded-full bg-emerald-500/15 text-emerald-600 text-xs font-bold flex items-center justify-center shrink-0">
            {pendingJobsCount}
          </span>
        </motion.button>

        {/* In App Messages */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/instructor/messages")}
          className="w-full rounded-2xl px-4 py-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.05)] border border-border/40 bg-card flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
            <img src={messagesIcon} alt="Messages" className="w-full h-full object-cover" style={{ borderRadius: '7px' }} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-foreground leading-tight">In App Messages</p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">Chat with pupils & parents</p>
          </div>
          <span className="min-w-[28px] h-7 px-2 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
            {pupilMsgCount}
          </span>
        </motion.button>

        {/* Test Requests */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.09 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/instructor/test-requests")}
          className="w-full rounded-2xl px-4 py-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.05)] border border-border/40 bg-card flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
            <img src={testRequestsIcon} alt="Test Requests" className="w-full h-full object-cover" style={{ borderRadius: '7px' }} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-foreground leading-tight">Test Requests</p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">Pending booking requests</p>
          </div>
          <span className="min-w-[28px] h-7 px-2 rounded-full bg-amber-500/15 text-amber-600 text-xs font-bold flex items-center justify-center shrink-0">
            {testSwapCount}
          </span>
        </motion.button>
      </div>

      {/* Content with horizontal padding */}
      <div className="px-4">

      {/* Celebration Confetti */}
      <CelebrationConfetti
        trigger={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />

      {/* Weather/Traffic Alerts */}
      {alerts.length > 0 && (
        <DrivingAlertsStrip 
          alerts={alerts} 
          onDismiss={dismissAlert}
          location={alertsLocation}
          className="mt-4"
        />
      )}

      {/* Tracker Reminder - show when offline and lesson soon */}
      {nextLesson && nextLesson.minutesUntil <= 30 && !isGPSConnected && (
          <TrackerReminderBanner 
            lessonId={nextLesson.lessonId}
            minutesUntil={nextLesson.minutesUntil}
          />
      )}

      </div>


      <div className="px-4">

      {/* YOUR DAY section */}
      {(nextLesson || (todayLessons && todayLessons.length > 1)) && (
        <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mt-6 mb-2">Your Day</p>
      )}

      {/* Next Lesson Card - only show when there's a lesson */}
      {nextLesson && (
        <div className="mt-2">
          <NextUpTile
            lessonId={nextLesson.lessonId}
            pupilId={nextLesson.pupilId}
            pupilName={nextLesson.pupilName}
            pupilProfileImage={nextLesson.pupilProfileImage}
            pupilPhone={nextLesson.pupilPhone}
            lessonDate={nextLesson.lessonDate}
            pickupPostcode={nextLesson.pickupPostcode}
            pickupLocation={nextLesson.pickupLocation}
            startTime={nextLesson.startTime}
            minutesUntil={nextLesson.minutesUntil}
            accountBalance={nextLesson.accountBalance}
            prepaidHours={nextLesson.prepaidHours}
            durationMinutes={nextLesson.durationMinutes}
            instructorId={instructorId}
          />
        </div>
      )}

      {/* Today's Schedule Cards */}
      {todayLessons && todayLessons.length > 0 && (
          <TodayMiniTimeline lessons={todayLessons} className="mt-4" />
      )}

      {/* Today's Route Map Preview */}
      <TodayRoutePreview 
        instructorId={instructorId}
        onTap={() => navigate("/instructor/diary")}
        className="mt-4"
      />

      {/* Gap Filler Suggestions */}
      {gapSuggestions && gapSuggestions.length > 0 && (
        <div className="mt-4">
          <GapFillerCard gaps={gapSuggestions} />
        </div>
      )}

      {/* QUICK ACTIONS section */}
      <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mt-6 mb-2">Quick Access</p>

      {/* Quick Action Tiles */}
      <div className="pb-6">
        <QuickActionTiles
          quickActions={content?.quick_actions || []}
          pendingJobsCount={pendingJobsCount}
          instructorId={instructorId}
          loading={contentLoading}
          isEditMode={isTileEditMode}
          onEditModeChange={setIsTileEditMode}
        />
      </div>





      {/* Vehicle Health & Agenda */}
      <div className="mt-4 space-y-3">
        {authInstructor?.id && (
          <VehicleHealthStrip instructorId={authInstructor.id} />
        )}
        <UnifiedAgendaTile instructorId={instructor?.id} />
        
      </div>

      {/* PLAN AHEAD section */}
      <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mt-6 mb-2">Plan Ahead</p>

      {/* Tomorrow Peek Card */}
      {tomorrowPreview && tomorrowPreview.lessonCount > 0 ? (
          <TomorrowPeekCard
            lessonCount={tomorrowPreview.lessonCount}
            totalHours={tomorrowPreview.totalHours}
            expectedEarnings={tomorrowPreview.expectedEarnings}
            firstLessonTime={tomorrowPreview.firstLessonTime}
            lessons={tomorrowPreview.lessons}
            instructorId={instructorId}
          />
      ) : tomorrowPreview && tomorrowPreview.lessonCount === 0 ? (
          <div
            className="bg-card rounded-2xl shadow-sm overflow-hidden cursor-pointer"
            onClick={() => navigate("/instructor/gaps")}
          >
            <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-4 py-3 text-white">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
              </div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden">
                    <img src={planAheadIcon} alt="Plan Ahead" className="h-7 w-7 object-contain" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Plan Ahead</h3>
                    <p className="text-white/70 text-[10px]">Nothing scheduled tomorrow</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-white/60" />
              </div>
            </div>
          </div>
      ) : null}


      {/* Road Alerts from National Highways */}
      <RoadAlertsRow alerts={alerts} className="mt-2" />

      {/* Setup Checklist for new instructors */}
      {instructorId && (
          <InstructorSetupChecklist 
            instructorId={instructorId} 
            variant="mobile"
          />
      )}

      {/* Your Plan — at the bottom */}
      <div className="mt-3">
        <PlanWidget />
      </div>

      {/* Floating Session Bar - shows during active tracking */}
      <FloatingSessionBar instructorId={instructorId} />
      </div>{/* end px-4 */}
      </>
      )}
      </div>
    </PullToRefresh>
  );
}
