import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Home, CalendarDays, Crosshair, User, MoreHorizontal, Mic, Loader2, Volume2 } from "lucide-react";
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

interface InstructorBottomNavProps {
  wallpaperColor?: string;
  voiceState?: "idle" | "listening" | "processing" | "speaking";
  onVoiceTap?: () => void;
}

export function InstructorBottomNav({ wallpaperColor, voiceState = "idle", onVoiceTap }: InstructorBottomNavProps) {
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

  const handleVoiceTap = () => {
    haptics.selection();
    onVoiceTap?.();
  };

  // Split items so mic sits in the middle
  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2);

  const renderTab = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    const isTrack = item.isTrack;
    const isSchedule = item.isSchedule;
    const isMore = item.isMore;

    let tabBadge = 0;
    if (item.showBadge) tabBadge = pendingJobsCount;
    if (isSchedule && todayLessonCount > 0) tabBadge = todayLessonCount;
    if (isMore) tabBadge = pendingJobsCount + unreadCount;

    const Icon = item.icon;
    const activeColor = 'hsl(var(--dsm-accent-blue))';
    const inactiveColor = 'hsl(var(--dsm-text-secondary))';
    const trackActiveColor = isTrack && isTrackingActive && !isActive ? "#10b981" : undefined;

    const showBadge = tabBadge > 0 && !(isSchedule && isActive);
    const badgeLabel = tabBadge > 99 ? "99+" : `${tabBadge}`;

    return (
      <button
        key={item.path}
        onClick={() => handleNavClick(item.path)}
        className="relative flex flex-col items-center cursor-pointer flex-1"
        style={{ gap: 4, minWidth: 0 }}
      >
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
            size={24}
            strokeWidth={isActive ? 2.2 : 1.8}
            color={isActive ? activeColor : trackActiveColor || inactiveColor}
            style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}
          />
          {showBadge && (
            <span
              className="absolute flex items-center justify-center"
              style={{
                top: -4, right: -2, minWidth: 18, height: 18, borderRadius: 9,
                padding: '0 5px', background: '#E15D5A', color: 'white',
                fontSize: 11, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.2px',
                border: '2px solid hsl(var(--dsm-card))',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
              }}
            >
              {badgeLabel}
            </span>
          )}
          {isTrack && isTrackingActive && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </div>
        <span
          style={{
            fontSize: 13,
            fontWeight: isActive ? 700 : 500,
            color: isActive ? activeColor : inactiveColor,
          }}
        >
          {item.label}
        </span>
      </button>
    );
  };

  const micGradient =
    voiceState === "listening" ? "linear-gradient(135deg, #ef4444, #dc2626)" :
    voiceState === "processing" ? "linear-gradient(135deg, #f59e0b, #d97706)" :
    voiceState === "speaking" ? "linear-gradient(135deg, #10b981, #059669)" :
    "linear-gradient(135deg, hsl(var(--dsm-accent-blue)), #4F6BD9)";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t-[0.5px]"
      style={{
        background: 'hsl(var(--dsm-card))',
        borderColor: 'hsl(var(--dsm-border))',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.08), 0 -1px 4px rgba(0,0,0,0.05)',
      }}
    >
      <div className="flex items-start justify-around" style={{ padding: '10px 8px 16px' }}>
        {navItems.map(renderTab)}
      </div>
      <div className="h-safe-area-inset-bottom" style={{ background: 'hsl(var(--dsm-card))' }} />
    </nav>
  );
}
