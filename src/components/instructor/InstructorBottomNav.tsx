import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Home, CalendarDays, Crosshair, User, MoreHorizontal } from "lucide-react";
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
  { label: "Track", icon: Crosshair, path: "/instructor/tracking", isTrack: true },
  { label: "Pupils", icon: User, path: "/instructor/pupils", showBadge: true },
  { label: "More", icon: MoreHorizontal, path: "/instructor/menu", isMore: true },
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
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden overflow-hidden border-t-[0.5px]"
      style={{
        background: 'hsl(var(--dsm-card))',
        borderColor: 'hsl(var(--dsm-border))',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.08), 0 -1px 4px rgba(0,0,0,0.05)',
      }}
    >
      <div className="flex items-start justify-around" style={{ padding: '10px 8px 16px' }}>
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

          const Icon = item.icon;
          const activeColor = 'hsl(var(--dsm-accent-blue))';
          const inactiveColor = 'hsl(var(--dsm-text-secondary))';
          const trackActiveColor = isTrack && isTrackingActive && !isActive
            ? "#10b981"
            : undefined;

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className="relative flex flex-col items-center cursor-pointer"
              style={{ gap: 4, minWidth: 60 }}
            >
              {/* Icon with optional rounded-pill accent background when active */}
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: 44,
                  height: 28,
                  borderRadius: 14,
                  background: isActive ? 'hsl(var(--dsm-accent-blue) / 0.12)' : 'transparent',
                }}
              >
                <Icon
                  size={22}
                  strokeWidth={1.6}
                  color={isActive ? activeColor : trackActiveColor || inactiveColor}
                  style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}
                />
                {/* Pupils badge */}
                {showNotification && (
                  <span
                    className="absolute flex items-center justify-center"
                    style={{
                      top: 0,
                      right: 4,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      padding: '0 4px',
                      background: 'hsl(var(--dsm-accent-red))',
                      color: 'white',
                      fontSize: 10,
                      fontWeight: 700,
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
                      top: 0,
                      right: 4,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      padding: '0 4px',
                      background: 'hsl(var(--dsm-accent-red))',
                      color: 'white',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
                {/* Track active dot */}
                {isTrack && isTrackingActive && (
                  <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
                {/* More dot */}
                {showMoreDot && (
                  <span
                    className="absolute"
                    style={{
                      top: 4,
                      right: 8,
                      width: 8,
                      height: 8,
                      background: 'hsl(var(--dsm-accent-red))',
                      borderRadius: '50%',
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? activeColor : inactiveColor,
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-safe-area-inset-bottom" style={{ background: 'hsl(var(--dsm-card))' }} />
    </nav>
  );
}
