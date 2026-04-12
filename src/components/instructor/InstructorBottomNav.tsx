import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Home, 
  CalendarDays, 
  Users, 
  Radio,
  PoundSterling,
  Grid3X3,
  LucideIcon
} from "lucide-react";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";

function getContrastColor(hex: string, activeOpacity = "1", inactiveOpacity = "0.6"): { active: string; inactive: string } {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const base = lum > 0.6 ? "0,0,0" : "255,255,255";
  return { active: `rgba(${base},${activeOpacity})`, inactive: `rgba(${base},${inactiveOpacity})` };
}
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { supabase } from "@/integrations/supabase/client";

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  showBadge?: boolean;
  isMessages?: boolean;
  isTrack?: boolean;
  isSchedule?: boolean;
  isMore?: boolean;
}

const navItems: NavItem[] = [
  { 
    label: "Home", 
    icon: Home, 
    path: "/instructor"
  },
  { 
    label: "Schedule", 
    icon: CalendarDays, 
    path: "/instructor/schedule",
    isSchedule: true
  },
  { 
    label: "Track", 
    icon: Radio, 
    path: "/instructor/tracking",
    isTrack: true
  },
  { 
    label: "Money", 
    icon: PoundSterling, 
    path: "/instructor/pay"
  },
  { 
    label: "Pupils", 
    icon: Users, 
    path: "/instructor/pupils",
    showBadge: true
  },
  { 
    label: "More", 
    icon: Grid3X3, 
    path: "/instructor/menu",
    isMore: true
  },
];

interface InstructorBottomNavProps {
  wallpaperColor?: string;
}

export function InstructorBottomNav({ wallpaperColor }: InstructorBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const pendingJobsCount = usePendingJobsCount();
  const { instructor } = useInstructorAuth();
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  
  // Get unread messages count
  const { data: unreadCount = 0 } = useUnreadMessagesCount(instructor?.id);
  
  // Get today's lesson count
  const { data: todayOverview } = useTodayOverview(instructor?.id);
  const todayLessonCount = todayOverview?.lessonCount || 0;

  // Check if there's an active tracking session
  useEffect(() => {
    if (!instructor?.id) return;

    const checkActiveSession = async () => {
      const { data } = await supabase
        .from("gps_devices")
        .select("current_session_id")
        .eq("instructor_id", instructor.id)
        .not("current_session_id", "is", null)
        .limit(1);

      setIsTrackingActive((data?.length ?? 0) > 0);
    };

    checkActiveSession();

    const interval = setInterval(checkActiveSession, 15000);
    return () => clearInterval(interval);
  }, [instructor?.id]);

  const handleNavClick = (path: string) => {
    haptics.selection();
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const contrast = wallpaperColor ? getContrastColor(wallpaperColor) : null;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/30",
        wallpaperColor ? "" : "bg-background/80 backdrop-blur-xl backdrop-saturate-150"
      )}
      style={wallpaperColor ? { backgroundColor: `${wallpaperColor}e6` } : undefined}
    >
      <div className="flex items-center justify-around h-16 w-full px-1 relative">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const showNotification = item.showBadge && pendingJobsCount > 0;
          const isTrack = item.isTrack;
          const isSchedule = item.isSchedule;
          const isMore = item.isMore;
          
          // Calculate badge count for this item
          const getBadgeCount = () => {
            if (isSchedule && todayLessonCount > 0) return todayLessonCount;
            return 0;
          };
          const badgeCount = getBadgeCount();
          
          // Check if More menu needs a dot indicator
          const showMoreDot = isMore && (pendingJobsCount > 0 || unreadCount > 0);

          // Track icon color override when tracking is active
          const trackIconColor = isTrack && isTrackingActive && !isActive
            ? "#10b981" // emerald-500
            : undefined;
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full"
            >
              <div className="relative">
                {/* Animated active pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={cn(
                      "absolute inset-0 rounded-2xl",
                      !contrast && "bg-primary"
                    )}
                    style={contrast ? { backgroundColor: contrast.active } : undefined}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <div
                  className="flex items-center justify-center rounded-2xl w-8 h-8 relative z-10"
                >
                  <item.icon
                    className="h-5 w-5 transition-all duration-200"
                    strokeWidth={isActive ? 2 : 1.8}
                    color={
                      trackIconColor
                        ? trackIconColor
                        : contrast
                        ? (isActive ? (wallpaperColor || "#ffffff") : contrast.inactive)
                        : (isActive ? "#ffffff" : "#8e8e93")
                    }
                  />
                </div>
                {showNotification && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-lg ring-2 ring-background">
                    {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                  </span>
                )}
                {isTrack && isTrackingActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
                )}
                {/* Schedule badge - today's lesson count */}
                {isSchedule && badgeCount > 0 && !isActive && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center shadow-lg ring-2 ring-background">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
                {/* More menu dot indicator */}
                {showMoreDot && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-background" />
                )}
              </div>
              <span
                className="text-[12px] font-medium transition-all duration-200"
                style={{
                  color: contrast
                    ? (isActive ? contrast.active : contrast.inactive)
                    : (isActive ? "hsl(var(--primary))" : "#8e8e93")
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-safe-area-inset-bottom" style={{ background: 'inherit' }} />
    </nav>
  );
}
