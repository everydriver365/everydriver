import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Home, CalendarDays, Crosshair, User, MoreHorizontal, Mic } from "lucide-react";
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

  const handleMicClick = () => {
    haptics.medium();
    navigate("/instructor/tracking");
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderTop: '0.5px solid rgba(15,35,65,0.08)',
        borderRadius: '22px 22px 0 0',
        boxShadow:
          '0 -10px 30px -12px rgba(15,35,65,0.18), 0 -2px 6px -2px rgba(15,35,65,0.08)',
        position: 'fixed',
      }}
    >
      {/* Centered floating mic — raised above nav */}
      <button
        type="button"
        onClick={handleMicClick}
        aria-label="Voice / Tracking"
        style={{
          position: 'absolute',
          top: -26,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 56,
          height: 56,
          borderRadius: 999,
          background: 'linear-gradient(180deg, #4D6BC4 0%, #3D55A1 100%)',
          color: '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '4px solid rgba(255,255,255,0.95)',
          boxShadow: '0 10px 24px -8px rgba(61,85,161,0.55), 0 4px 10px -4px rgba(15,35,65,0.25)',
          cursor: 'pointer',
          zIndex: 2,
        }}
      >
        <Mic size={22} strokeWidth={2.2} />
      </button>
      <div className="flex items-start justify-around" style={{ padding: '8px 6px 12px' }}>
        {navItems.flatMap((item, idx) => {
          const nodes: React.ReactNode[] = [];
          if (idx === 2) {
            nodes.push(
              <div key="mic-spacer" aria-hidden style={{ width: 56, minWidth: 56 }} />
            );
          }
          nodes.push(((): React.ReactNode => {
          const isActive = location.pathname === item.path;
          const isTrack = item.isTrack;
          const isSchedule = item.isSchedule;
          const isMore = item.isMore;

          let tabBadge = 0;
          if (item.showBadge) tabBadge = pendingJobsCount;
          if (isSchedule && todayLessonCount > 0) tabBadge = todayLessonCount;
          if (isMore) tabBadge = pendingJobsCount + unreadCount;

          const Icon = item.icon;
          const ACCENT = '#315FAE';
          const ACCENT_TINT = '#E6EEFB';
          const INACTIVE = '#6B7A90';
          const trackActiveColor =
            isTrack && isTrackingActive && !isActive ? '#10b981' : undefined;

          const showBadge = tabBadge > 0 && !(isSchedule && isActive);
          const badgeLabel = tabBadge > 99 ? '99+' : `${tabBadge}`;

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className="relative flex flex-col items-center cursor-pointer"
              style={{ gap: 3, minWidth: 60, padding: '2px 4px' }}
            >
              <motion.div
                className="relative flex items-center justify-center"
                animate={{ scale: isActive ? 1 : 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                style={{
                  width: 50,
                  height: 30,
                  borderRadius: 999,
                  background: isActive ? ACCENT_TINT : 'transparent',
                  transition: 'background 180ms ease',
                }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.4 : 1.9}
                  color={isActive ? ACCENT : trackActiveColor || INACTIVE}
                  style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}
                />

                {showBadge && (
                  <span
                    className="absolute flex items-center justify-center"
                    style={{
                      top: -3,
                      right: 4,
                      minWidth: 17,
                      height: 17,
                      borderRadius: 9,
                      padding: '0 5px',
                      background: '#E15D5A',
                      color: 'white',
                      fontSize: 10.5,
                      fontWeight: 700,
                      lineHeight: 1,
                      letterSpacing: '-0.2px',
                      border: '2px solid #FFFFFF',
                      boxShadow: '0 1px 2px rgba(15,35,65,0.18)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {badgeLabel}
                  </span>
                )}

                {isTrack && isTrackingActive && !showBadge && (
                  <span
                    className="absolute rounded-full bg-emerald-500 animate-pulse"
                    style={{
                      top: 2,
                      right: 8,
                      width: 7,
                      height: 7,
                      border: '2px solid #FFFFFF',
                    }}
                  />
                )}
              </motion.div>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? ACCENT : INACTIVE,
                  letterSpacing: '-0.1px',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      <div
        className="h-safe-area-inset-bottom"
        style={{ background: 'rgba(255,255,255,0.92)' }}
      />
    </nav>
  );
}
