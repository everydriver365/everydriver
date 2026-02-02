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
  PoundSterling
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
import { useTraccarConnectionStatus } from "@/hooks/useTraccarConnectionStatus";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useDrivingAlerts } from "@/hooks/useDrivingAlerts";
import { useInstructorStreak } from "@/hooks/useInstructorStreak";
import { useWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { useTomorrowPreview } from "@/hooks/useTomorrowPreview";
import { useRealGapSlots } from "@/hooks/useRealGapSlots";
import { useLastWeekComparison } from "@/hooks/useLastWeekComparison";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { QuickActionTiles } from "@/components/instructor/QuickActionTiles";
import { SmartRemindersCard } from "@/components/instructor/SmartRemindersCard";
import { InstructorSetupChecklist } from "@/components/instructor/InstructorSetupChecklist";
import { NextLessonCard } from "@/components/instructor/NextLessonCard";
import { DrivingAlertsStrip } from "@/components/instructor/DrivingAlertsStrip";
import { WeeklyGoalRing } from "@/components/instructor/WeeklyGoalRing";


import { GapFillerCard } from "@/components/instructor/GapFillerCard";
import { FuelFinderCard } from "@/components/instructor/FuelFinderCard";
import { CelebrationConfetti } from "@/components/instructor/CelebrationConfetti";
import { QuietDayEmpty } from "@/components/instructor/QuietDayEmpty";
import { HomePageSkeleton } from "@/components/instructor/HomePageSkeleton";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useTheme } from "@/context/ThemeContext";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { triggerHaptic } from "@/lib/haptics";

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
  
  // Traccar connection status and today's overview
  const { isConnected: isTraccarConnected } = useTraccarConnectionStatus(instructorId || null);
  const { data: todayOverview, isLoading: todayLoading } = useTodayOverview(instructorId);
  const { data: nextLesson } = useNextLessonDetails(instructorId);
  const { data: unreadCount } = useUnreadMessagesCount(instructorId);
  const { alerts, dismissAlert, location: alertsLocation } = useDrivingAlerts(instructorId);
  
  // New enhancement hooks
  const { data: streak } = useInstructorStreak(instructorId);
  const { data: weeklyGoals } = useWeeklyGoals(instructorId);
  const { data: tomorrowPreview } = useTomorrowPreview(instructorId);
  const { data: gapSuggestions } = useRealGapSlots(instructorId);
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
                GPS Tracker Setup
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

      {/* Hero Section with Overlapping Card */}
      <div className="relative">
        {/* Hero Image */}
        <div className="w-full h-56 overflow-hidden">
          <img 
            src={content?.hero_image_url || "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800"} 
            alt="Hero" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Overlapping Motivation Card */}
        <div className="relative -mt-16 mx-3">
          <div className="bg-card rounded-2xl shadow-lg p-4 border border-border/50">
            <div className="flex items-start justify-between gap-3">
              {/* Left Content */}
              <div className="flex-1 min-w-0">
                {/* TODAY Label with Status */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-muted-foreground tracking-wide">TODAY</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    isTraccarConnected 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isTraccarConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {isTraccarConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
                
                {/* Personalized Greeting */}
                <h1 className="text-lg font-bold text-foreground tracking-tight">
                  {getGreeting(firstName)}
                </h1>
                
                {/* Subtitle */}
                <p className="text-muted-foreground text-xs leading-relaxed mt-0.5 line-clamp-2">
                  {content?.motivation_subtitle || "Enjoy your lessons today, get in touch if we can help!"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

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


      {/* Gap Filler Suggestions */}
      {gapSuggestions && gapSuggestions.length > 0 && (
        <GapFillerCard
          gaps={gapSuggestions}
          className="mt-4"
        />
      )}

      {/* Fuel Finder Card */}
      <FuelFinderCard
        instructorId={instructorId}
        className="mt-4"
      />

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

      {/* Today's Stats */}
      <div className="px-4 mt-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold text-foreground text-sm mb-3">Today's Stats</h3>
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1 text-primary">
                <BookOpen className="h-4 w-4" />
                <span className="text-lg font-bold">{currentLessons}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">Lessons</span>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Clock className="h-4 w-4" />
                <span className="text-lg font-bold">{todayOverview?.totalHours || 0}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">Hours</span>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <PoundSterling className="h-4 w-4" />
                <span className="text-lg font-bold">{todayOverview?.expectedEarnings || 0}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">Expected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Goal Progress */}
      {weeklyGoals && (
        <div className="px-4 mt-4">
          <div className="bg-card rounded-xl border border-border p-4">
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
          </div>
        </div>
      )}

      {/* Setup Checklist for new instructors */}
      {instructorId && (
        <InstructorSetupChecklist 
          instructorId={instructorId} 
          variant="mobile"
        />
      )}


      {/* Bottom Navigation */}
      <InstructorBottomNav />
      </div>
    </PullToRefresh>
  );
}
