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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useInstructorHomepageContent } from "@/hooks/useInstructorHomepageContent";
import { useGPSConnectionStatus } from "@/hooks/useGPSConnectionStatus";
import { useGPSAutoReconnect } from "@/hooks/useGPSAutoReconnect";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useDrivingAlerts } from "@/hooks/useDrivingAlerts";
import { useInstructorStreak } from "@/hooks/useInstructorStreak";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { useTomorrowPreview } from "@/hooks/useTomorrowPreview";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { useLastWeekComparison } from "@/hooks/useLastWeekComparison";
import { useInstructorLastPosition } from "@/hooks/useInstructorLastPosition";
import { useGPSPoller } from "@/hooks/useGPSPoller";
import { useUrgentAlerts } from "@/hooks/useUrgentAlerts";
import { QuickActionTiles } from "@/components/instructor/QuickActionTiles";
import { SmartRemindersCard } from "@/components/instructor/SmartRemindersCard";
import { InstructorSetupChecklist } from "@/components/instructor/InstructorSetupChecklist";
import { PlanWidget } from "@/components/instructor/dashboard/PlanWidget";
import { UnifiedAgendaTile } from "@/components/instructor/dashboard/UnifiedAgendaTile";
import { ReferralStatsWidget } from "@/components/instructor/dashboard/ReferralStatsWidget";
import { NextUpTile } from "@/components/instructor/NextUpTile";
import { DrivingAlertsStrip } from "@/components/instructor/DrivingAlertsStrip";
import { VehicleHealthStrip } from "@/components/instructor/VehicleHealthStrip";
import { WeeklyGoalRing } from "@/components/instructor/WeeklyGoalRing";
import { TrackerReminderBanner } from "@/components/instructor/TrackerReminderBanner";
import { ContextualHomeHero } from "@/components/instructor/ContextualHomeHero";
import { ReadyToTeachTile } from "@/components/instructor/ReadyToTeachTile";
import instructorHeroImg from "@/assets/instructor-hero.jpeg";
import { RadialFAB } from "@/components/instructor/RadialFAB";
import { UrgentAlertOverlay } from "@/components/instructor/UrgentAlertOverlay";
import { TodayRoutePreview } from "@/components/instructor/TodayRoutePreview";
import { GapFillerCard } from "@/components/instructor/GapFillerCard";
import { CelebrationConfetti } from "@/components/instructor/CelebrationConfetti";
import { QuietDayEmpty } from "@/components/instructor/QuietDayEmpty";
import { HomePageSkeleton } from "@/components/instructor/HomePageSkeleton";
import { AppStyleHomeView } from "@/components/instructor/AppStyleHomeView";
import { TodayMiniTimeline } from "@/components/instructor/TodayMiniTimeline";
import { TomorrowPeekCard } from "@/components/instructor/TomorrowPeekCard";
import { RoadAlertsRow } from "@/components/instructor/RoadAlertsRow";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { QuickStatsChips } from "@/components/instructor/QuickStatsChips";
import { EmptyState } from "@/components/ui/EmptyState";
import { FloatingSessionBar } from "@/components/instructor/FloatingSessionBar";
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
  
  // Auto-reconnect when GPS drops
  const { 
    isReconnecting: isGPSReconnecting, 
    retryCount: gpsRetryCount,
    manualReconnect: triggerManualReconnect 
  } = useGPSAutoReconnect({
    instructorId: instructorId || null,
    enabled: true,
    maxRetries: 5,
    onReconnected: () => {
      console.log("[Home] GPS auto-reconnected successfully");
      manualGPSReconnect(); // Refresh the status hook
    },
    onMaxRetriesReached: () => {
      console.log("[Home] GPS auto-reconnect max retries reached");
    },
  });
  
  const { data: todayOverview, isLoading: todayLoading } = useTodayOverview(instructorId);
  const { data: nextLesson } = useNextLessonDetails(instructorId);
  const { data: unreadCount } = useUnreadMessagesCount(instructorId);
  const { alerts, dismissAlert, location: alertsLocation, currentWeather } = useDrivingAlerts(instructorId);
  const { roadName: gpsRoadName } = useInstructorLastPosition(instructorId || null);
  
  // Poll GPS server every 10 seconds on home screen for fresh connection status
  useGPSPoller({
    enabled: !!instructorId,
    intervalMs: 10000,
  });
  
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
         className="min-h-screen flex flex-col dark:bg-background overflow-x-hidden relative"
         style={{ backgroundColor: wallpaperColor || '#E8F1FE' }}
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

      {/* Ready to Teach tile — overlapping hero */}
      <div className="relative -mt-8 mx-4">
        <ReadyToTeachTile
          firstName={firstName}
          profileImageUrl={instructor?.profile_image_url}
          lessonCount={todayOverview?.lessonCount || 0}
          totalHours={todayOverview?.totalHours || 0}
          expectedEarnings={todayOverview?.expectedEarnings || 0}
          progressPercent={weeklyGoals?.progressPercent || 0}
          temperature={currentWeather?.temperature ?? null}
          weatherIcon={currentWeather?.icon || "Cloud"}
          weatherDesc={currentWeather?.description || ""}
          nextMinutesUntil={nextLesson?.minutesUntil}
          nextPupilFirstName={nextLesson?.pupilName}
          nextLessonTime={nextLesson?.startTime ? nextLesson.startTime.substring(0, 5) : undefined}
          nextPostcode={nextLesson?.pickupPostcode ?? undefined}
          isOnline={isGPSConnected}
        />
      </div>
      {/* Job Offers & Messages buttons - right under hero */}
      <div className="px-4 flex flex-col gap-2 mt-3">
        {pendingJobsCount > 0 && (
          <button
            onClick={() => navigate("/instructor/jobs")}
            className="flex items-center justify-between w-full bg-gradient-to-r from-amber-100 to-card dark:from-amber-950/20 dark:to-card border border-amber-200/60 dark:border-amber-800/30 rounded-xl px-4 py-3 shadow-[0_2px_12px_rgba(20,37,66,0.08)] hover:shadow-[0_4px_16px_rgba(20,37,66,0.12)] hover:ring-1 hover:ring-amber-300/50 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <span className="font-medium text-sm text-amber-900 dark:text-amber-100">View Job Offers</span>
            </div>
            <span className="min-w-[24px] h-6 px-2 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
              {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
            </span>
          </button>
        )}
        <button
          onClick={() => navigate("/instructor/messages")}
          className="flex items-center justify-between w-full bg-gradient-to-r from-blue-100 to-card dark:from-blue-950/20 dark:to-card border border-blue-200/60 dark:border-blue-800/30 rounded-xl px-4 py-3 shadow-[0_2px_12px_rgba(20,37,66,0.08)] hover:shadow-[0_4px_16px_rgba(20,37,66,0.12)] hover:ring-1 hover:ring-blue-300/50 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <span className="font-medium text-sm text-blue-900 dark:text-blue-100">View Messages</span>
          </div>
          {(unreadCount || 0) > 0 && (
            <span className="min-w-[24px] h-6 px-2 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
              {(unreadCount || 0) > 9 ? "9+" : unreadCount}
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content with horizontal padding */}
      <div className="px-4">

      {/* Vehicle Health Strip */}
      {authInstructor?.id && (
        <VehicleHealthStrip instructorId={authInstructor.id} />
      )}

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





      {/* Plan, Reminders & Referrals Widgets */}
      <div className="mt-4 space-y-3">
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
            className="mt-4"
          />
      ) : tomorrowPreview && tomorrowPreview.lessonCount === 0 ? (
          <div className="mt-2">
            <div
              className="flex items-center gap-2.5 py-2 px-3 bg-muted/50 cursor-pointer"
              onClick={() => navigate("/instructor/gaps")}
            >
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground">Nothing upcoming tomorrow</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 ml-auto flex-shrink-0" />
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


      {/* Floating Session Bar - shows during active tracking */}
      <FloatingSessionBar instructorId={instructorId} />
      </div>{/* end px-4 */}
      </>
      )}
      </div>
    </PullToRefresh>
  );
}
