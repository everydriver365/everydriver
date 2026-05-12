import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Calendar, Target, Users, Mic, Loader2, Volume2 } from "lucide-react";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { haptics } from "@/lib/haptics";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { supabase } from "@/integrations/supabase/client";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  showBadge?: boolean;
  isTrack?: boolean;
  isSchedule?: boolean;
}

const leftItems: NavItem[] = [
  { label: "Home", icon: Home, path: "/instructor" },
  { label: "Diary", icon: Calendar, path: "/instructor/schedule", isSchedule: true },
];

const rightItems: NavItem[] = [
  { label: "Track", icon: Target, path: "/instructor/tracking", isTrack: true },
  { label: "Pupils", icon: Users, path: "/instructor/pupils", showBadge: true },
];

interface InstructorBottomNavProps {
  wallpaperColor?: string;
  voiceState?: "idle" | "listening" | "processing" | "speaking";
  onVoiceTap?: () => void;
}

const ACTIVE = "#C8242C";
const INACTIVE = "#6B6B6B";
const FAB_BLUE = "#1E6FB8";
const PAGE_BG = "#F5F4F1";

export function InstructorBottomNav({ voiceState = "idle", onVoiceTap }: InstructorBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const pendingJobsCount = usePendingJobsCount();
  const { instructor } = useInstructorAuth();
  const [isTrackingActive, setIsTrackingActive] = useState(false);

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

  const renderTab = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    let badge = 0;
    if (item.showBadge) badge = pendingJobsCount;
    if (item.isSchedule && todayLessonCount > 0) badge = todayLessonCount;
    const showBadge = badge > 0 && !(item.isSchedule && isActive);
    const badgeLabel = badge > 99 ? "99+" : `${badge}`;

    const color = isActive ? ACTIVE : INACTIVE;

    return (
      <motion.button
        key={item.path}
        type="button"
        onClick={() => handleNavClick(item.path)}
        whileTap={{ scale: 0.96 }}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
        className="flex flex-col items-center justify-center flex-1"
        style={{ gap: 2, minHeight: 44, background: "transparent", border: "none", WebkitTapHighlightColor: "transparent" }}
      >
        <span style={{ position: "relative", display: "inline-flex", color }}>
          <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
          {showBadge && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -8,
                minWidth: 14,
                height: 14,
                padding: "0 3px",
                borderRadius: 8,
                background: ACTIVE,
                color: "#fff",
                fontSize: 9,
                fontWeight: 500,
                lineHeight: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {badgeLabel}
            </span>
          )}
          {item.isTrack && isTrackingActive && (
            <span
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                width: 8,
                height: 8,
                borderRadius: 4,
                background: "#10b981",
              }}
              className="animate-pulse"
            />
          )}
        </span>
        <span style={{ fontSize: 10, fontWeight: isActive ? 500 : 400, color, lineHeight: 1 }}>
          {item.label}
        </span>
      </motion.button>
    );
  };

  const fabBg =
    voiceState === "listening" ? "#ef4444" :
    voiceState === "processing" ? "#f59e0b" :
    voiceState === "speaking" ? "#10b981" :
    FAB_BLUE;

  return (
    <nav
      role="navigation"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        paddingBottom: `env(safe-area-inset-bottom, 0px)`,
        background: "#FFFFFF",
        borderTop: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          padding: "6px 12px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          position: "relative",
        }}
      >
        {leftItems.map(renderTab)}

        <div className="flex-1 flex items-center justify-center">
          <motion.button
            type="button"
            role="button"
            aria-label="Voice command"
            onClick={() => { haptics.selection(); onVoiceTap?.(); }}
            whileTap={{ scale: 0.96 }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              background: fabBg,
              color: "#fff",
              border: `4px solid ${PAGE_BG}`,
              marginTop: -20,
              boxShadow: "0 2px 8px rgba(30, 111, 184, 0.25)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {voiceState === "idle" && <Mic size={22} strokeWidth={1.8} aria-hidden="true" />}
            {voiceState === "listening" && (
              <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1 }} style={{ display: "inline-flex" }}>
                <Mic size={22} strokeWidth={1.8} aria-hidden="true" />
              </motion.span>
            )}
            {voiceState === "processing" && <Loader2 size={22} className="animate-spin" aria-hidden="true" />}
            {voiceState === "speaking" && <Volume2 size={22} strokeWidth={1.8} aria-hidden="true" />}
          </motion.button>
        </div>

        {rightItems.map(renderTab)}
      </div>
    </nav>
  );
}
