import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Home, CalendarDays, Radio, PoundSterling, Users, LayoutGrid } from "lucide-react";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { haptics } from "@/lib/haptics";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { supabase } from "@/integrations/supabase/client";
import type { LucideIcon } from "lucide-react";

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
  { label: "Pupils", icon: Users, path: "/instructor/pupils", showBadge: true },
  { label: "More", icon: LayoutGrid, path: "/instructor/menu", isMore: true },
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
        .from("lesson_telematics")
        .select("id")
        .eq("instructor_id", instructor.id)
        .eq("manually_started", true)
        .is("ended_at", null)
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
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden overflow-hidden bg-white border-t-[0.5px] border-black/[0.06]"
      style={{
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.08), 0 -1px 4px rgba(0,0,0,0.05)',
      }}
    >
      {/* Top edge */}
      <div className="h-px w-full bg-black/[0.06]" />
      <div className="flex items-start justify-around" style={{ padding: '10px 0 16px' }}>
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
          
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className="relative flex flex-col items-center cursor-pointer"
              style={{ gap: 3, minWidth: 52 }}
            >
              <div className="relative">
                <Icon 
                  size={22} 
                  strokeWidth={2} 
                  color={isActive ? '#2A394F' : trackIconColor || '#A1A1AA'} 
                />
                {/* Pupils badge */}
                {showNotification && (
                  <span
                    className="absolute flex items-center justify-center"
                    style={{
                      top: -2,
                      right: -4,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      padding: '0 4px',
                      background: '#ff3b30',
                      color: 'white',
                      fontSize: 10,
                      fontWeight: 700,
                      boxShadow: '0 1px 4px rgba(255,59,48,0.4)',
                    }}
                  >
                    {pendingJobsCount > 9 ? "9+" : pendingJobsCount}
                  </span>
                )}
                {/* Schedule badge */}
                {isSchedule && badgeCount > 0 && !isActive && (
                  <span
                    className="absolute flex items-center justify-center"
                    style={{
                      top: -2,
                      right: -4,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      padding: '0 4px',
                      background: '#ff3b30',
                      color: 'white',
                      fontSize: 10,
                      fontWeight: 700,
                      boxShadow: '0 1px 4px rgba(255,59,48,0.4)',
                    }}
                  >
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
                {/* Track active dot */}
                {isTrack && isTrackingActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
                {/* More dot */}
                {showMoreDot && (
                  <span
                    className="absolute"
                    style={{
                      top: 0,
                      right: 4,
                      width: 8,
                      height: 8,
                      background: '#ff3b30',
                      borderRadius: '50%',
                      boxShadow: '0 1px 3px rgba(255,59,48,0.4)',
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#2A394F' : '#A1A1AA',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </nav>
  );
}
