import { useState } from "react";
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
  Play
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
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { useInstructorHomepageContent } from "@/hooks/useInstructorHomepageContent";
import { useTraccarConnectionStatus } from "@/hooks/useTraccarConnectionStatus";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { QuickActionTiles } from "@/components/instructor/QuickActionTiles";
import { SmartRemindersCard } from "@/components/instructor/SmartRemindersCard";
import { InstructorSetupChecklist } from "@/components/instructor/InstructorSetupChecklist";
import { useTheme } from "@/context/ThemeContext";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

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

export function InstructorMobileHome({ 
  instructor, 
  todaysLessonCount,
  onPaymentClick 
}: InstructorMobileHomeProps) {
  const pendingJobsCount = usePendingJobsCount();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { instructor: authInstructor } = useInstructorAuth();
  const [isTileEditMode, setIsTileEditMode] = useState(false);
  const { content, loading: contentLoading } = useInstructorHomepageContent();

  // Use auth context for instructor ID
  const instructorId = authInstructor?.id || instructor?.id;
  
  // Traccar connection status and today's overview
  const { isConnected: isTraccarConnected } = useTraccarConnectionStatus(instructorId || null);
  const { data: todayOverview } = useTodayOverview(instructorId);

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const firstName = instructor?.name?.split(" ")[0] || "Instructor";
  
  // Calculate max lessons for progress (default 6 if no data)
  const maxLessons = 6;
  const currentLessons = todayOverview?.lessonCount || todaysLessonCount || 0;

  return (
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

          {/* Messages Button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-primary/80 hover:text-primary hover:bg-primary/10 h-8 w-8 relative"
            onClick={() => navigate("/instructor/messages")}
          >
            <MessageSquare className="h-5 w-5" />
            {pendingJobsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
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
        <div className="relative -mt-20 mx-4">
          <div className="bg-card rounded-3xl shadow-xl p-5 border border-border/50">
            <div className="flex items-start justify-between">
              {/* Left Content */}
              <div className="flex-1">
                {/* TODAY Label with Status */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-muted-foreground tracking-wide">TODAY</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isTraccarConnected 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isTraccarConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {isTraccarConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
                
                {/* Title */}
                <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">
                  READY TO TEACH?
                </h1>
                
                {/* Subtitle */}
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {content?.motivation_subtitle || "Enjoy your lessons today, get in touch if we can help! You are not alone."}
                </p>
                
                {/* Go Live Button */}
                <Button 
                  onClick={() => navigate("/instructor/traccar")}
                  className="bg-primary text-primary-foreground rounded-xl px-5 py-2.5 h-auto font-semibold shadow-md"
                >
                  <Play className="h-4 w-4 mr-2 fill-current" />
                  Go Live
                </Button>
              </div>
              
              {/* Right - Progress Indicator */}
              <div className="flex flex-col items-center ml-4">
                <div className="relative w-16 h-16">
                  {/* Background circle */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-muted/20"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${(currentLessons / maxLessons) * 97.4} 97.4`}
                      strokeLinecap="round"
                      className="text-primary"
                    />
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-foreground">{currentLessons}</span>
                    <span className="text-xs text-muted-foreground">/{maxLessons}</span>
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground mt-1">TODAY</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="px-4 pb-4">
        <QuickActionTiles
          quickActions={content?.quick_actions || []}
          pendingJobsCount={pendingJobsCount}
          instructorId={instructorId}
          loading={contentLoading}
          isEditMode={isTileEditMode}
          onEditModeChange={setIsTileEditMode}
        />
      </div>

      {/* Smart Reminders */}
      <SmartRemindersCard />

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
  );
}
