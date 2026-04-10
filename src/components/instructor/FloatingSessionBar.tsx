import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Car, Clock, Activity, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { useActiveSession } from "@/hooks/useActiveSession";

interface FloatingSessionBarProps {
  instructorId: string | null | undefined;
  className?: string;
}

// Live waveform animation component
function LiveWaveform() {
  return (
    <div className="flex items-center gap-0.5 h-4">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="w-0.5 bg-emerald-500 rounded-full"
          animate={{
            height: ["8px", "16px", "8px"],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function FloatingSessionBar({ instructorId, className }: FloatingSessionBarProps) {
  const navigate = useNavigate();
  const { activeSession, hasActiveSession } = useActiveSession(instructorId);
  const y = useMotionValue(0);

  const handleTap = () => {
    haptics.selection();
    navigate("/instructor/tracking");
  };

  // Swipe-up gesture to navigate
  const handleDragEnd = (_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y < -50 || info.velocity.y < -300) {
      haptics.medium();
      navigate("/instructor/tracking");
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatSpeed = (speedKmh: number | null) => {
    if (speedKmh === null) return "--";
    const mph = Math.round(speedKmh * 0.621371);
    return `${mph} mph`;
  };

  return (
    <AnimatePresence>
      {hasActiveSession && activeSession && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.3}
          onDragEnd={handleDragEnd}
          style={{ y }}
          className={cn(
            "fixed bottom-20 left-4 right-4 z-30",
            className
          )}
        >
          <motion.button
            onClick={handleTap}
            className={cn(
              "w-full flex items-center gap-3 p-3",
              "backdrop-blur-xl bg-card/90 dark:bg-card/80",
              "border border-primary/20 dark:border-primary/30",
              "border-l-4 border-l-emerald-500",
              "rounded-none shadow-lg",
              "active:scale-[0.98] transition-transform"
            )}
            whileTap={{ scale: 0.98 }}
          >
            {/* Pupil Avatar */}
            <Avatar className="h-10 w-10 border-2 border-emerald-500/30">
              <AvatarImage src={activeSession.pupilAvatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {getInitials(activeSession.pupilName)}
              </AvatarFallback>
            </Avatar>

            {/* Session Info */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm truncate">
                  {activeSession.pupilName || "Tracking"}
                </span>
                {activeSession.isLive && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                    <Activity className="h-2.5 w-2.5" />
                    LIVE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(activeSession.elapsedMinutes)}
                </span>
                <span className="flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  {formatSpeed(activeSession.currentSpeed)}
                </span>
              </div>
            </div>

            {/* Live Indicator */}
            {activeSession.isLive ? (
              <LiveWaveform />
            ) : (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="text-[10px]">Paused</span>
              </div>
            )}

            {/* Expand hint */}
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
