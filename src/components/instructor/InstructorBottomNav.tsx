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
  { label: "Home", icon: Home, path: "/instructor" },
  { label: "Schedule", icon: CalendarDays, path: "/instructor/schedule", isSchedule: true },
  { label: "Track", icon: Radio, path: "/instructor/tracking", isTrack: true },
  { label: "Money", icon: PoundSterling, path: "/instructor/pay" },
  { label: "Pupils", icon: Users, path: "/instructor/pupils", showBadge: true },
  { label: "More", icon: Grid3X3, path: "/instructor/menu", isMore: true },
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
  
  const { data: unreadCount = 0 } = useUnreadMessagesCount(instructor?.id);
  const { data: todayOverview } = useTodayOverview(instructor?.id);
  const todayLessonCount = todayOverview?.lessonCount || 0;

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

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/80 backdrop-blur-xl border-t border-[hsl(240_5%_78%/0.5)]"
    >
      <div className="flex items-center justify-around h-16 w-full px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const showNotification = item.showBadge && pendingJobsCount > 0;
          const isTrack = item.isTrack;
          const isSchedule = item.isSchedule;
          const isMore = item.isMore;
          
          const getBadgeCount = () => {
            if (isSchedule && todayLessonCount > 0) return todayLessonCount;
            return 0;
          };
          const badgeCount = getBadgeCount();
          const showMoreDot = isMore && (pendingJobsCount > 0 || unreadCount > 0);

          const trackIconColor = isTrack && isTrackingActive && !isActive
            ? "#10b981"
            : undefined;
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full"
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-2xl bg-[hsl(211_100%_50%)]/10"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <div className="flex items-center justify-center rounded-2xl w-8 h-8 relative z-10">
                  <item.icon
                    className="h-5 w-5 transition-all duration-200"
                    strokeWidth={isActive ? 2.2 : 1.8}
                    color={
                      trackIconColor
                        ? trackIconColor
                        : isActive
                        ? "#007AFF"
                        : "#8E8E93"
                    }
                  />
                </div>
                {showNotification && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow-lg ring-2 ring-white">
                    {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                  </span>
                )}
                {isTrack && isTrackingActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                )}
                {isSchedule && badgeCount > 0 && !isActive && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[hsl(211_100%_50%)] text-white text-[10px] font-semibold flex items-center justify-center shadow-lg ring-2 ring-white">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
                {showMoreDot && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-destructive ring-2 ring-white" />
                )}
              </div>
              <span
                className={cn(
                  "text-[12px] font-medium transition-all duration-200",
                  isActive ? "text-[#007AFF] font-semibold" : "text-[#8E8E93]"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Safe area for iOS — matches navy bg */}
      <div className="h-safe-area-inset-bottom bg-white/80" />
    </nav>
  );
}
