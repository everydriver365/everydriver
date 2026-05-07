import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Home, CalendarDays, Crosshair, Users, Mic, Loader2, Volume2 } from "lucide-react";
import { usePendingJobsCount } from "@/hooks/usePendingJobsCount";
import { haptics } from "@/lib/haptics";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  showBadge?: boolean;
  isTrack?: boolean;
}

const ITEMS: NavItem[] = [
  { label: "Home", icon: Home, path: "/instructor" },
  { label: "Diary", icon: CalendarDays, path: "/instructor/schedule" },
  { label: "Track", icon: Crosshair, path: "/instructor/tracking", isTrack: true },
  { label: "Pupils", icon: Users, path: "/instructor/pupils", showBadge: true },
];

const RED = "#C8242C";
const BLUE = "#1E6FB8";
const INACTIVE = "#6B6B6B";
const PAGE_BG = "#F5F4F1";

interface Props {
  wallpaperColor?: string;
  voiceState?: "idle" | "listening" | "processing" | "speaking";
  onVoiceTap?: () => void;
}

export function InstructorBottomNav({ voiceState = "idle", onVoiceTap }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const pendingJobsCount = usePendingJobsCount();
  const { instructor } = useInstructorAuth();
  const [isTrackingActive, setIsTrackingActive] = useState(false);

  useEffect(() => {
    if (!instructor?.id) return;
    const check = async () => {
      const { data } = await supabase
        .from("lesson_telematics")
        .select("id")
        .eq("instructor_id", instructor.id)
        .eq("manually_started", true)
        .is("ended_at", null)
        .limit(1);
      setIsTrackingActive((data?.length ?? 0) > 0);
    };
    check();
    const i = setInterval(check, 15000);
    return () => clearInterval(i);
  }, [instructor?.id]);

  const handleNav = (path: string) => {
    haptics.selection();
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderTab = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;
    const badge = item.showBadge ? pendingJobsCount : 0;
    const color = isActive ? RED : INACTIVE;
    return (
      <button
        key={item.path}
        onClick={() => handleNav(item.path)}
        className="relative flex flex-col items-center justify-center flex-1"
        style={{ gap: 3, minHeight: 44, minWidth: 0 }}
        aria-label={item.label}
      >
        <div className="relative" style={{ width: 24, height: 24 }}>
          <Icon
            size={22}
            strokeWidth={isActive ? 2 : 1.7}
            color={color}
          />
          {badge > 0 && (
            <span
              className="absolute flex items-center justify-center"
              style={{
                top: -4,
                right: -6,
                minWidth: 16,
                height: 16,
                padding: "0 4px",
                borderRadius: 8,
                background: RED,
                color: "#FFFFFF",
                fontSize: 10,
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              {badge > 9 ? "9+" : badge}
            </span>
          )}
          {item.isTrack && isTrackingActive && (
            <span
              className="absolute"
              style={{ top: 0, right: -2, width: 7, height: 7, borderRadius: 4, background: "#1D9E75" }}
            />
          )}
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color,
            letterSpacing: -0.1,
          }}
        >
          {item.label}
        </span>
      </button>
    );
  };

  const left = ITEMS.slice(0, 2);
  const right = ITEMS.slice(2);

  return (
    <nav
      className="fixed left-0 right-0 z-50 md:hidden flex justify-center pointer-events-none"
      style={{
        bottom: "max(12px, env(safe-area-inset-bottom))",
      }}
    >
      <div
        className="pointer-events-auto relative flex items-center"
        style={{
          background: "#FFFFFF",
          borderRadius: 28,
          padding: "8px 12px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
          width: "calc(100% - 24px)",
          maxWidth: 420,
          gap: 4,
        }}
      >
        <div className="flex flex-1" style={{ gap: 4 }}>{left.map(renderTab)}</div>

        <div className="flex items-start justify-center" style={{ width: 64, alignSelf: "stretch" }}>
          <motion.button
            type="button"
            onClick={() => {
              haptics.selection();
              onVoiceTap?.();
            }}
            whileTap={{ scale: 0.92 }}
            aria-label="Voice command"
            className="flex items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              marginTop: -20,
              background: BLUE,
              color: "#FFFFFF",
              border: `4px solid ${PAGE_BG}`,
              boxShadow: "0 6px 14px rgba(30,111,184,0.35)",
            }}
          >
            {voiceState === "idle" && <Mic size={20} strokeWidth={2} />}
            {voiceState === "listening" && (
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                <Mic size={20} strokeWidth={2} />
              </motion.div>
            )}
            {voiceState === "processing" && <Loader2 size={20} className="animate-spin" />}
            {voiceState === "speaking" && <Volume2 size={20} strokeWidth={2} />}
          </motion.button>
        </div>

        <div className="flex flex-1" style={{ gap: 4 }}>{right.map(renderTab)}</div>
      </div>
    </nav>
  );
}
