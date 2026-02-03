import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CreditCard, 
  Settings,
  Car,
  Moon,
  Sun,
  LogOut,
  User,
  Bell,
  HelpCircle,
  Palette,
  Navigation,
  Award,
  LayoutGrid,
  MessageSquare,
  Play,
  BookOpen,
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
  AlertTriangle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useInstructorHomepageContent } from "@/hooks/useInstructorHomepageContent";
import { useGPSConnectionStatus } from "@/hooks/useGPSConnectionStatus";
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
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { QuickActionTiles } from "@/components/instructor/QuickActionTiles";
import { SmartRemindersCard } from "@/components/instructor/SmartRemindersCard";
import { InstructorSetupChecklist } from "@/components/instructor/InstructorSetupChecklist";
import { NextLessonCard } from "@/components/instructor/NextLessonCard";
import { DrivingAlertsStrip } from "@/components/instructor/DrivingAlertsStrip";
import { WeeklyGoalRing } from "@/components/instructor/WeeklyGoalRing";
import { TrackerReminderBanner } from "@/components/instructor/TrackerReminderBanner";
import { ContextualHomeHero } from "@/components/instructor/ContextualHomeHero";
import { RadialFAB } from "@/components/instructor/RadialFAB";
import { TodayRoutePreview } from "@/components/instructor/TodayRoutePreview";
import { GapFillerCard } from "@/components/instructor/GapFillerCard";
import { FuelFinderCard } from "@/components/instructor/FuelFinderCard";
import { CelebrationConfetti } from "@/components/instructor/CelebrationConfetti";
import { QuietDayEmpty } from "@/components/instructor/QuietDayEmpty";
import { HomePageSkeleton } from "@/components/instructor/HomePageSkeleton";
import { QuickStatsChips } from "@/components/instructor/QuickStatsChips";
import { FloatingSessionBar } from "@/components/instructor/FloatingSessionBar";
import { CardSection } from "@/components/ui/CardSection";
import { GlassCard } from "@/components/ui/GlassCard";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useTheme } from "@/context/ThemeContext";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { triggerHaptic } from "@/lib/haptics";

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
  return `Ready to plan, ${firstName}?`;
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
  const [showConfetti, setShowConfetti] = useState(false);
  const { content, loading: contentLoading } = useInstructorHomepageContent();

  // Use auth context for instructor ID
  const instructorId = authInstructor?.id || instructor?.id;
  
  // GPS connection status and today's overview
  const { isConnected: isGPSConnected, deviceName: gpsDeviceName } = useGPSConnectionStatus(instructorId || null);
  const { data: todayOverview, isLoading: todayLoading } = useTodayOverview(instructorId);
  const { data: nextLesson } = useNextLessonDetails(instructorId);
  const { data: unreadCount } = useUnreadMessagesCount(instructorId);
  const { alerts, dismissAlert, location: alertsLocation, currentWeather } = useDrivingAlerts(instructorId);
  const { roadName: gpsRoadName } = useInstructorLastPosition(instructorId || null);
  
  // New enhancement hooks
  const { data: streak } = useInstructorStreak(instructorId);
  const { data: weeklyGoals } = useWeeklyGoals(instructorId);
  const { data: tomorrowPreview } = useTomorrowPreview(instructorId);
  const { data: gapSuggestions } = useRealGapSlots(instructorId);
  
  // Derive display location - prefer GPS road name, fallback to alerts location
  const displayLocation = gpsRoadName || alertsLocation;
  const { data: lastWeekComparison } = useLastWeekComparison(instructorId);

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
  };

  // Show skeleton while loading critical data
  if (contentLoading && !content) {
    return <HomePageSkeleton />;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background pb-24 overflow-x-hidden relative">
      {/* Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 px-4 pb-3 flex items-center justify-between overflow-hidden pt-[max(0.75rem,env(safe-area-inset-top))] bg-background border-b border-border shadow-sm">
        {/* Logo */}
        <img 
          src="/everydriver-logo-instructor.png"
          alt="EveryDriver" 
          className="h-6 object-contain"
        />
        
        {/* Controls and Avatar on the right */}
        <div className="flex items-center gap-1">
          {/* QR Code Button */}
          {instructor?.payment_qr_url && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary/80 hover:text-primary hover:bg-primary/10 h-8 px-2"
              onClick={onPaymentClick}
            >
              <span className="text-xs font-bold border border-current rounded px-1">QR</span>
            </Button>
          )}

          {/* Messages Button with unread badge */}
          <Button
            variant="ghost"
            size="icon"
            className="text-primary/80 hover:text-primary hover:bg-primary/10 h-8 w-8 relative"
            onClick={() => navigate("/instructor/messages")}
          >
            <MessageSquare className="h-5 w-5" />
            {(unreadCount || 0) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary/80 hover:text-primary hover:bg-primary/10 h-8 w-8"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/instructor/settings")}>
                <User className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/instructor/settings/traccar")}>
                <Navigation className="mr-2 h-4 w-4" />
                Connect Tracker
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/instructor/traccar")}>
                <Car className="mr-2 h-4 w-4" />
                Live Tracking
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/instructor/settings")}>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/instructor/settings")}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsTileEditMode(true)}>
                <LayoutGrid className="mr-2 h-4 w-4" />
                Edit Home Tiles
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Appearance</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('oled')}>
                <Moon className="mr-2 h-4 w-4 fill-current" />
                OLED Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Palette className="mr-2 h-4 w-4" />
                System Default
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 border-2 border-border cursor-pointer">
                <AvatarImage src={instructor?.profile_image_url || undefined} alt={instructor?.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {instructor?.name ? getInitials(instructor.name) : "?"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{instructor?.name || "Instructor"}</span>
                  <span className="text-xs text-muted-foreground">Driving Instructor</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/instructor/settings")}>
                <User className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/instructor/test-results")}>
                <Award className="mr-2 h-4 w-4" />
                Test Results
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/instructor/pay")}>
                <CreditCard className="mr-2 h-4 w-4" />
                Payments
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/instructor/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-16 pt-[env(safe-area-inset-top,0px)]" />

      {/* Contextual Home Hero */}
      <ContextualHomeHero
        firstName={firstName}
        isGPSConnected={isGPSConnected}
        gpsDeviceName={gpsDeviceName}
        displayLocation={displayLocation}
        currentWeather={currentWeather}
        alerts={alerts}
        todayOverview={todayOverview}
        tomorrowPreview={tomorrowPreview}
        nextLesson={nextLesson ? {
          pupilName: nextLesson.pupilName,
          pickupPostcode: nextLesson.pickupPostcode,
          startTime: nextLesson.startTime,
          minutesUntil: nextLesson.minutesUntil,
        } : null}
        weeklyStats={weeklyGoals ? {
          hoursThisWeek: weeklyGoals.hoursThisWeek,
          hoursGoal: weeklyGoals.hoursGoal,
          progressPercent: weeklyGoals.progressPercent,
        } : null}
        heroImageUrl={content?.hero_image_url}
        motivationSubtitle={content?.motivation_subtitle}
      />


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

      {/* Next Lesson Card - only show when there's a lesson */}
      {nextLesson && (
        <div className="mt-4">
          <NextLessonCard
            pupilName={nextLesson.pupilName}
            pupilProfileImage={nextLesson.pupilProfileImage}
            pupilPhone={nextLesson.pupilPhone}
            pickupPostcode={nextLesson.pickupPostcode}
            pickupLocation={nextLesson.pickupLocation}
            startTime={nextLesson.startTime}
            minutesUntil={nextLesson.minutesUntil}
            accountBalance={nextLesson.accountBalance}
            prepaidHours={nextLesson.prepaidHours}
          />
        </div>
      )}

      {/* Today's Route Map Preview */}
      <TodayRoutePreview 
        instructorId={instructorId}
        onTap={() => navigate("/instructor/diary")}
        className="mt-4"
      />

      {/* Gap Filler Suggestions */}
      {gapSuggestions && gapSuggestions.length > 0 && (
        <GapFillerCard
          gaps={gapSuggestions}
          className="mt-4"
        />
      )}

      {/* Quick Action Tiles */}
      <div className="px-4 pt-4 pb-4">
        <QuickActionTiles
          quickActions={content?.quick_actions || []}
          pendingJobsCount={pendingJobsCount}
          instructorId={instructorId}
          loading={contentLoading}
          isEditMode={isTileEditMode}
          onEditModeChange={setIsTileEditMode}
        />
      </div>

      {/* Fuel Finder Card - Above Today's Stats */}
      <FuelFinderCard
        instructorId={instructorId}
        className="mt-4"
      />

      {/* Today's Stats - Glass Card */}
      <div className="px-4 mt-4">
        <GlassCard intensity="medium" className="p-4">
          <h3 className="font-semibold text-foreground text-sm mb-3">Today's Stats</h3>
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1 text-primary">
                <BookOpen className="h-4 w-4" />
                <span className="text-lg font-bold">
                  <AnimatedCounter value={currentLessons} />
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">Lessons</span>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1 text-primary">
                <Clock className="h-4 w-4" />
                <span className="text-lg font-bold">
                  <AnimatedCounter value={todayOverview?.totalHours || 0} />
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">Hours</span>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1 text-primary">
                <PoundSterling className="h-4 w-4" />
                <span className="text-lg font-bold">
                  <AnimatedCounter value={todayOverview?.expectedEarnings || 0} prefix="£" />
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">Expected</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Weekly Goal Progress - Glass Card */}
      {weeklyGoals && (
        <div className="px-4 mt-4">
          <GlassCard intensity="medium" glow={weeklyGoals.progressPercent >= 75} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-sm mb-1">Weekly Progress</h3>
                <p className="text-xs text-muted-foreground">
                  {weeklyGoals.lessonsThisWeek} lessons · £{weeklyGoals.earningsThisWeek} earned
                </p>
                {lastWeekComparison && (
                  <p className={`text-[10px] mt-1 ${lastWeekComparison.isImprovement ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {lastWeekComparison.isImprovement ? '↑' : '↓'} {Math.abs(lastWeekComparison.percentChange)}% vs last week
                  </p>
                )}
              </div>
              <WeeklyGoalRing
                hoursThisWeek={weeklyGoals.hoursThisWeek}
                hoursGoal={weeklyGoals.hoursGoal}
                progressPercent={weeklyGoals.progressPercent}
                isAheadOfLastWeek={lastWeekComparison?.isImprovement || false}
              />
            </div>
          </GlassCard>
        </div>
      )}

      {/* Setup Checklist for new instructors */}
      {instructorId && (
        <InstructorSetupChecklist 
          instructorId={instructorId} 
          variant="mobile"
        />
      )}


      {/* Floating Session Bar - shows during active tracking */}
      <FloatingSessionBar instructorId={instructorId} />

      {/* Bottom Navigation */}
      <InstructorBottomNav />
      </div>
    </PullToRefresh>
  );
}
