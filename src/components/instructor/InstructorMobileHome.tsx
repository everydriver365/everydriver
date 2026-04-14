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
import { useMonthlyGoals } from "@/hooks/useMonthlyGoals";
import { useTomorrowPreview } from "@/hooks/useTomorrowPreview";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { useLastWeekComparison } from "@/hooks/useLastWeekComparison";
import { useInstructorLastPosition } from "@/hooks/useInstructorLastPosition";

import { useUrgentAlerts } from "@/hooks/useUrgentAlerts";
import { QuickActionTiles } from "@/components/instructor/QuickActionTiles";
import { HomepageHero } from "@/components/instructor/HomepageHero";
import { ActivityTilesGrid } from "@/components/instructor/ActivityTilesGrid";
import { TelematicsTile } from "@/components/instructor/TelematicsTile";
import { SwipeableQuickAccess } from "@/components/instructor/SwipeableQuickAccess";
import { TodayLessonsList } from "@/components/instructor/TodayLessonsList";
import { SmartRemindersCard } from "@/components/instructor/SmartRemindersCard";

import { PlanWidget } from "@/components/instructor/dashboard/PlanWidget";
import { UnifiedAgendaTile } from "@/components/instructor/dashboard/UnifiedAgendaTile";
import { ReferralStatsWidget } from "@/components/instructor/dashboard/ReferralStatsWidget";
import { NextUpTile } from "@/components/instructor/NextUpTile";
import planAheadIcon from "@/assets/plan-ahead-icon.png";
import { DrivingAlertsStrip } from "@/components/instructor/DrivingAlertsStrip";
import { WeeklyGoalRing } from "@/components/instructor/WeeklyGoalRing";
import { TrackerReminderBanner } from "@/components/instructor/TrackerReminderBanner";
import { MorningBriefingCard } from "@/components/instructor/MorningBriefingCard";
import { InsightTilesGrid } from "@/components/instructor/InsightTilesGrid";

import { PupilMilestoneFeed } from "@/components/instructor/PupilMilestoneFeed";

import { ContextualHomeHero } from "@/components/instructor/ContextualHomeHero";
import { ReadyToTeachTile } from "@/components/instructor/ReadyToTeachTile";
import instructorHeroImg from "@/assets/hero-learner.jpg";
import jobOffersIcon from "@/assets/job-offers-icon.png";
import scheduleIcon from "@/assets/schedule-icon.png";
import messagesIcon from "@/assets/messages-icon.png";
import testRequestsIcon from "@/assets/test-requests-icon.png";
import { RadialFAB } from "@/components/instructor/RadialFAB";
import { UrgentAlertOverlay } from "@/components/instructor/UrgentAlertOverlay";
import { TodayRoutePreview } from "@/components/instructor/TodayRoutePreview";
import waitingRoomIcon from "@/assets/waiting-room-icon.png";
import { BottomPromoGroup } from "@/components/instructor/BottomPromoGroup";
import { ImpactAlertCard } from "@/components/instructor/ImpactAlertCard";
import calendarIcon from "@/assets/calendar-icon.png";
import instructorBg from "@/assets/instructor-bg-signs.png";
import { WeatherAlertBanner } from "@/components/instructor/WeatherAlertBanner";
import { VehicleHealthCard } from "@/components/instructor/VehicleHealthCard";
import { IdleTimeCostCard } from "@/components/instructor/IdleTimeCostCard";

import { CelebrationConfetti } from "@/components/instructor/CelebrationConfetti";
import { QuietDayEmpty } from "@/components/instructor/QuietDayEmpty";
import { HomePageSkeleton } from "@/components/instructor/HomePageSkeleton";

import { TomorrowPreviewCard } from "@/components/instructor/TomorrowPreviewCard";
import { AppStyleHomeView } from "@/components/instructor/AppStyleHomeView";
import { LockScreenHomeView } from "@/components/instructor/LockScreenHomeView";
import { CleanHomeView } from "@/components/instructor/CleanHomeView";
import { IOSNativeHomeView } from "@/components/instructor/IOSNativeHomeView";
import { CompactHomeView } from "@/components/instructor/CompactHomeView";
import { BestMateHomeView } from "@/components/instructor/BestMateHomeView";
import { MissionControlHomeView } from "@/components/instructor/MissionControlHomeView";

import { TodayMiniTimeline } from "@/components/instructor/TodayMiniTimeline";
import { TodayScheduleAgenda } from "@/components/instructor/TodayScheduleAgenda";
import { useTomorrowLessons } from "@/hooks/useTomorrowLessons";
import { TomorrowPeekCard } from "@/components/instructor/TomorrowPeekCard";
import { RoadAlertsRow } from "@/components/instructor/RoadAlertsRow";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { QuickStatsChips } from "@/components/instructor/QuickStatsChips";
import { EmptyState } from "@/components/ui/EmptyState";
import { FloatingSessionBar } from "@/components/instructor/FloatingSessionBar";
import { EndOfDaySummary } from "@/components/instructor/EndOfDaySummary";
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
  const { data: monthlyGoals } = useMonthlyGoals(instructorId);
  const { data: tomorrowPreview } = useTomorrowPreview(instructorId);
  const { data: gapSuggestions } = useRealGapSlots(instructorId);
  const { data: todayLessons } = useTodayRemainingLessons(instructorId);
  const { data: tomorrowLessons } = useTomorrowLessons(instructorId);
  
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
         style={{
           backgroundColor: '#F4F7F6',
         }}
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
      ) : layoutStyle === "ios-native" ? (
        <IOSNativeHomeView
          instructorId={instructorId}
          instructor={instructor}
        />
      ) : layoutStyle === "compact" ? (
        <CompactHomeView
          instructorId={instructorId}
          instructor={instructor}
        />
      ) : layoutStyle === "bestmate" ? (
        <BestMateHomeView
          instructorId={instructorId}
          instructor={instructor}
        />
      ) : layoutStyle === "mission-control" ? (
        <MissionControlHomeView
          instructorId={instructorId}
          instructor={instructor}
        />
      ) : (
      <>
      {/* 1. Hero Banner */}
      <HomepageHero
        firstName={firstName}
        heroImageUrl={personalHeroUrl || content?.hero_image_url}
        profileImageUrl={instructor?.profile_image_url}
        weeklyLessonsScheduled={weeklyGoals?.lessonsScheduled || 0}
        weeklyLessonsCompleted={weeklyGoals?.lessonsCompleted || 0}
        weeklyLessonsTotal={weeklyGoals?.lessonsThisWeek || 0}
        todayCompleted={todayOverview?.completedCount || 0}
        todayTotal={todayOverview?.lessonCount || 0}
        monthlyCompleted={monthlyGoals?.lessonsCompleted || 0}
        monthlyScheduled={monthlyGoals?.lessonsScheduled || 0}
        monthlyTotal={monthlyGoals?.lessonsThisMonth || 0}
      />

      {/* Sticky next-up bar */}
      <AnimatePresence>
        {showFAB && nextLesson && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-2 left-3 right-3 z-50 bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between shadow-lg rounded-2xl"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Timer className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-yellow-300 mr-1">Next Up</span>
              <span className="text-sm font-semibold truncate">{nextLesson.pupilName}</span>
            </div>
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full shrink-0">
              {nextLesson.minutesUntil <= 0 ? "Now" : nextLesson.minutesUntil < 60 ? `${nextLesson.minutesUntil}m` : `${Math.floor(nextLesson.minutesUntil / 60)}h ${nextLesson.minutesUntil % 60}m`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Morning Briefing — prominent position above activity tiles */}
      <MorningBriefingCard instructorId={instructorId} />

      {/* 2. Activity Tiles Grid */}
      <ActivityTilesGrid
        pendingJobsCount={pendingJobsCount}
        unreadMessagesCount={pupilMsgCount}
        testRequestsCount={testSwapCount}
        gapSlotsCount={gapSuggestions?.length || 0}
      />

      {/* Telematics Tile */}
      <TelematicsTile />

      {/* View Schedule Tile */}
      <div className="px-5 mt-3">
        <button
          onClick={() => navigate("/instructor/schedule")}
          className="w-full flex items-center justify-between transition-shadow"
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 22,
            padding: "14px 16px",
            border: "1px solid #DAE4E1",
            boxShadow: "0 2px 12px rgba(15, 70, 60, 0.06), 0 1px 4px rgba(15, 70, 60, 0.03)",
          }}
        >
          <div className="flex items-center gap-3">
            <img src={calendarIcon} alt="Schedule" className="w-8 h-8" />
            <span className="text-[15px] font-semibold" style={{ color: "#12263A" }}>View Schedule</span>
          </div>
          <ChevronRight className="h-4 w-4" style={{ color: "#6A7A78" }} />
        </button>
      </div>

      <div className="px-5">
        <CelebrationConfetti
          trigger={showConfetti}
          onComplete={() => setShowConfetti(false)}
        />

        {alerts.length > 0 && (
          <DrivingAlertsStrip
            alerts={alerts}
            onDismiss={dismissAlert}
            location={alertsLocation}
            className="mt-4"
          />
        )}

        

        {nextLesson && nextLesson.minutesUntil <= 30 && !isGPSConnected && (
          <TrackerReminderBanner
            lessonId={nextLesson.lessonId}
            minutesUntil={nextLesson.minutesUntil}
          />
        )}
      </div>

      {/* Pupil Milestone Feed */}
      <div className="px-5">
        <PupilMilestoneFeed instructorId={instructorId} />
      </div>

      {/* 4. Your Day */}
      <div className="px-5">

        {/* Empty state or lessons */}
        {!nextLesson && (!todayLessons || todayLessons.length === 0) && (todayOverview?.lessonCount || 0) === 0 ? (
          <QuietDayEmpty className="mt-4" />
        ) : (
          <>
            {(nextLesson || (todayLessons && todayLessons.length > 1)) && (
              <p className="text-[12px] font-semibold uppercase tracking-wider mt-6 mb-2" style={{ color: "#6A7A78", letterSpacing: "0.08em" }}>Your Day</p>
            )}

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
                  checkInStatus={nextLesson.checkInStatus}
                  lastLessonPlan={nextLesson.lastLessonPlan}
                />
              </div>
            )}

            <TodayScheduleAgenda
              todayLessons={todayLessons || []}
              tomorrowLessons={tomorrowLessons || []}
              className="mt-4"
            />

            {/* 5. Today's Route Map Preview */}
            <TodayRoutePreview
              instructorId={instructorId}
              onTap={() => navigate("/instructor/diary")}
              className="mt-4"
            />
          </>
        )}

        {/* 7. Quick Access — Swipeable Grid */}
        <p className="text-[12px] font-semibold uppercase tracking-wider mt-6 mb-2" style={{ color: "#6A7A78", letterSpacing: "0.08em" }}>Quick Access</p>
        <div className="pb-4">
          <SwipeableQuickAccess />
        </div>

        {/* Weather Alert */}
        <WeatherAlertBanner className="mt-4" />

        {/* Impact Alerts */}
        <div className="mt-4">
          <ImpactAlertCard instructorId={instructorId} />
        </div>

        {/* Insights Tiles */}
        <p className="text-[12px] font-semibold uppercase tracking-wider mt-6 mb-2" style={{ color: "#6A7A78", letterSpacing: "0.08em" }}>Insights</p>
        <InsightTilesGrid gapCount={gapSuggestions?.length || 0} />

        {/* Vehicle Health & Idle Time */}
        <VehicleHealthCard instructorId={instructorId} className="mt-4" />
        <IdleTimeCostCard instructorId={instructorId} className="mt-3" />

        <div className="h-6" />


        {/* End of Day Summary */}
        <EndOfDaySummary instructorId={instructorId} />

        {/* Waiting Room & Discover Features */}
        <BottomPromoGroup className="mt-6 mb-6" />


        {/* 10. Floating Session Bar */}
        <FloatingSessionBar instructorId={instructorId} />
      </div>
      </>
      )}
      </div>
    </PullToRefresh>
  );
}
