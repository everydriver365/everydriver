import { useState, useEffect } from "react";
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
  LayoutGrid,
  Sun,
  BookOpen,
  ChevronRight,
  CheckCircle,
  Calendar,
  Mail,
  Target,
  Timer,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { EarningsForecaster } from "@/components/instructor/EarningsForecaster";
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
import { CheckEngineBanner } from "@/components/instructor/CheckEngineBanner";
import { ContextualHomeHero } from "@/components/instructor/ContextualHomeHero";
import { ReadyToTeachTile } from "@/components/instructor/ReadyToTeachTile";
import instructorHeroImg from "@/assets/instructor-hero.jpeg";
import jobOffersIcon from "@/assets/job-offers-icon.png";
import messagesIcon from "@/assets/messages-icon.png";
import { RadialFAB } from "@/components/instructor/RadialFAB";
import { UrgentAlertOverlay } from "@/components/instructor/UrgentAlertOverlay";
import { TodayRoutePreview } from "@/components/instructor/TodayRoutePreview";
import { GapFillerCard } from "@/components/instructor/GapFillerCard";
import { CelebrationConfetti } from "@/components/instructor/CelebrationConfetti";
import { QuietDayEmpty } from "@/components/instructor/QuietDayEmpty";
import { HomePageSkeleton } from "@/components/instructor/HomePageSkeleton";
import { AppStyleHomeView } from "@/components/instructor/AppStyleHomeView";
import { LockScreenHomeView } from "@/components/instructor/LockScreenHomeView";
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
      ) : (
      <>
      {/* Hero Image — full bleed */}
      <div className="w-full h-[38vh] min-h-[220px] max-h-[320px] overflow-hidden relative">
        <img
          src={personalHeroUrl || content?.hero_image_url || instructorHeroImg}
          alt="Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Gradient Overlap Card */}
      <div className="relative -mt-10 mx-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="bg-card rounded-none shadow-sm overflow-hidden"
        >
          {/* Gradient header */}
          <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-4 py-4 text-white">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
            </div>
            <div className="relative flex items-center gap-3">
              {instructor?.profile_image_url ? (
                <img src={instructor.profile_image_url} alt={firstName} className="h-11 w-11 rounded-full object-cover ring-2 ring-white/30" />
              ) : (
                <div className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                  {firstName[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold truncate">{getGreeting(firstName)}</h2>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    isGPSConnected
                      ? "bg-emerald-500/30 text-emerald-100"
                      : "bg-white/20 text-white/70"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isGPSConnected ? "bg-emerald-400 animate-pulse" : "bg-white/50"}`} />
                    {isGPSConnected ? "Online" : "Offline"}
                  </span>
                  {currentWeather?.temperature != null && (
                    <span className="text-white/70 text-xs flex items-center gap-1">
                      <WeatherIcon icon={currentWeather.icon || "Cloud"} className="h-3.5 w-3.5 text-white/70" />
                      {currentWeather.temperature}°C
                      {currentWeather.description ? ` • ${currentWeather.description}` : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Stats grid */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-primary/10">
                <BookOpen className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-bold text-foreground leading-none">{todayOverview?.lessonCount || 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Lessons</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-500/10">
                <PoundSterling className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-sm font-bold text-foreground leading-none">£{todayOverview?.expectedEarnings || 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Expected</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-violet-500/10">
                <Target className="h-4 w-4 text-violet-500" />
                <div>
                  <p className="text-sm font-bold text-foreground leading-none">{Math.min(weeklyGoals?.progressPercent || 0, 100)}%</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Weekly</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-500/10">
                <Timer className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-bold text-foreground leading-none">
                    {nextLesson?.startTime ? `${nextLesson.startTime.substring(0, 5)}${nextLesson.pickupPostcode ? ` • ${nextLesson.pickupPostcode}` : ""}` : "--"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{nextLesson?.pupilName || "Next up"}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      {/* Job Offers — gradient style */}
      <div className="px-4 flex flex-col gap-2 mt-3">
        {pendingJobsCount > 0 && (
          <button
            onClick={() => navigate("/instructor/jobs")}
            className="w-full bg-card rounded-none shadow-sm overflow-hidden active:scale-[0.99] transition-all"
          >
            <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-4 py-3 text-white">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
              </div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src={jobOffersIcon} alt="Job Offers" className="h-10 w-10 object-cover" />
                  <div>
                    <span className="font-semibold text-sm">Job Offers</span>
                    <p className="text-white/70 text-[10px]">{pendingJobsCount} pending offer{pendingJobsCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-red-400 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                  {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                </span>
              </div>
            </div>
          </button>
        )}
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

      {/* Check Engine Warning - show if active fault codes */}
      <CheckEngineBanner />

      {/* Tracker Reminder - show when offline and lesson soon */}
      {nextLesson && nextLesson.minutesUntil <= 30 && !isGPSConnected && (
          <TrackerReminderBanner 
            lessonId={nextLesson.lessonId}
            minutesUntil={nextLesson.minutesUntil}
          />
      )}

      {/* Messages tile — above test requests */}
      <button
        onClick={() => navigate("/instructor/messages")}
        className="w-full bg-card rounded-none shadow-sm overflow-hidden active:scale-[0.99] transition-all mt-4"
      >
        <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-4 py-3 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/5" />
          </div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src={messagesIcon} alt="Messages" className="h-10 w-10 object-cover" />
              <div>
                <span className="font-semibold text-sm">Messages</span>
                <p className="text-white/70 text-[10px]">
                  {pupilMsgCount > 0 ? `${pupilMsgCount} unread` : "No new messages"}
                </p>
              </div>
            </div>
            {pupilMsgCount > 0 && (
              <span className="min-w-[28px] h-7 px-2.5 rounded-full bg-red-400 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                {pupilMsgCount > 9 ? "9+" : pupilMsgCount}
              </span>
            )}
          </div>
        </div>
      </button>

      </div>

      {/* Test Requests Tile */}
      {authInstructor?.id && (
        <TestRequestsTile instructorId={authInstructor.id} />
      )}

      <div className="px-4">

      {/* YOUR DAY section */}
      {(nextLesson || (todayLessons && todayLessons.length > 1)) && (
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mt-6 mb-2">YOUR DAY</p>
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

      {/* Today's Mini Timeline */}
      {todayLessons && todayLessons.length > 1 && (
          <TodayMiniTimeline lessons={todayLessons} className="mt-4" />
      )}

      {/* Today's Route Map Preview */}
      <TodayRoutePreview 
        instructorId={instructorId}
        onTap={() => navigate("/instructor/diary")}
        className="mt-4"
      />




      {/* QUICK ACTIONS section */}
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mt-6 mb-2">QUICK ACTIONS</p>

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
        <PlanWidget />
        
      </div>

      {/* PLAN AHEAD section */}
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mt-6 mb-2">PLAN AHEAD</p>

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
            className="bg-card rounded-none shadow-sm overflow-hidden cursor-pointer"
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

      {/* Earnings Forecast Widget - under Plan Ahead */}
      {instructorId && (
        <div className="mt-2">
          <EarningsForecaster instructorId={instructorId} />
        </div>
      )}

      {/* Road Alerts from National Highways */}
      <RoadAlertsRow alerts={alerts} className="mt-2" />

      {/* Setup Checklist for new instructors */}
      {instructorId && (
          <InstructorSetupChecklist 
            instructorId={instructorId} 
            variant="mobile"
          />
      )}


      {/* Floating Session Bar - shows during active tracking */}
      <FloatingSessionBar instructorId={instructorId} />
      </div>{/* end px-4 */}
      </>
      )}
      </div>
    </PullToRefresh>
  );
}
