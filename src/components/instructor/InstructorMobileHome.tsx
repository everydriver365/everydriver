import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CalendarClock,
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
  MessageSquare
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
import { useTraccarConnectionStatus } from "@/hooks/useTraccarConnectionStatus";
import { useInstructorLastPosition } from "@/hooks/useInstructorLastPosition";
import { InstructorNotificationsDropdown } from "@/components/instructor/InstructorNotificationsDropdown";
import { InstructorBottomNav } from "@/components/instructor/InstructorBottomNav";
import { HomeMapHero } from "@/components/instructor/HomeMapHero";
import { HomeQuickActions } from "@/components/instructor/HomeQuickActions";
import { HomeTodaySchedule } from "@/components/instructor/HomeTodaySchedule";
import { HomeMoneyOverview } from "@/components/instructor/HomeMoneyOverview";
import { SmartRemindersCard } from "@/components/instructor/SmartRemindersCard";
import { InstructorSetupChecklist } from "@/components/instructor/InstructorSetupChecklist";
import { useTheme } from "@/context/ThemeContext";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  // Use auth context for instructor ID
  const instructorId = authInstructor?.id || instructor?.id;
  
  // Traccar device connection status
  const { isConnected: isTraccarConnected } = useTraccarConnectionStatus(instructorId || null);
  
  // Get instructor's last GPS position for the map
  const lastPosition = useInstructorLastPosition(instructorId || null);

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

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

      {/* Tracking Status Banner */}
      {isTraccarConnected && (
        <div className="bg-primary text-primary-foreground py-2 px-4 text-center">
          <span className="text-sm font-semibold tracking-wide">TRACKING LIVE</span>
        </div>
      )}

      {/* Status Message */}
      <div className="bg-muted/50 py-2 px-4 border-b">
        <p className="text-sm text-center text-muted-foreground">
          {isTraccarConnected ? "You're currently live." : "Your vehicle is offline."}
        </p>
      </div>

      {/* Live Map Hero */}
      <HomeMapHero
        latitude={lastPosition.latitude}
        longitude={lastPosition.longitude}
        heading={lastPosition.heading}
        roadName={lastPosition.roadName}
        isActive={lastPosition.isActive}
        isLoading={lastPosition.isLoading}
      />

      {/* Road Name below map */}
      {lastPosition.roadName && (
        <div className="px-4 py-2 border-b bg-background">
          <p className="text-sm font-medium text-foreground">{lastPosition.roadName}</p>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="px-4 py-4">
        <HomeQuickActions onTakePayment={onPaymentClick} />
      </div>

      {/* Today's Schedule */}
      <div className="px-4 pb-4">
        <HomeTodaySchedule instructorId={instructorId} />
      </div>

      {/* Money Overview */}
      <div className="px-4 pb-4">
        <HomeMoneyOverview instructorId={instructorId} />
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
