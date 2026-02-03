import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type TimeOfDay = "morning" | "day" | "evening" | "night";
type IllustrationVariant = "driving-scene" | "road" | "landscape" | "abstract";

interface ThemeIllustrationProps {
  variant?: IllustrationVariant;
  className?: string;
  animate?: boolean;
}

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return "morning";
  if (hour >= 10 && hour < 17) return "day";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

// Color palettes for different times of day
const colorPalettes: Record<TimeOfDay, {
  sky: string;
  skyGradient: string;
  sun: string;
  ground: string;
  road: string;
  accent: string;
}> = {
  morning: {
    sky: "#FFE4C4",
    skyGradient: "#87CEEB",
    sun: "#FFD700",
    ground: "#90EE90",
    road: "#4A4A4A",
    accent: "#FF7F50",
  },
  day: {
    sky: "#87CEEB",
    skyGradient: "#1E90FF",
    sun: "#FFD700",
    ground: "#228B22",
    road: "#333333",
    accent: "#32CD32",
  },
  evening: {
    sky: "#FF6B6B",
    skyGradient: "#4A0080",
    sun: "#FF4500",
    ground: "#2F4F4F",
    road: "#2D2D2D",
    accent: "#FF8C00",
  },
  night: {
    sky: "#1A1A2E",
    skyGradient: "#0F0F23",
    sun: "#F5F5DC", // Moon
    ground: "#1A1A1A",
    road: "#1F1F1F",
    accent: "#4169E1",
  },
};

// Driving scene SVG illustration
function DrivingSceneIllustration({ 
  timeOfDay, 
  animate 
}: { 
  timeOfDay: TimeOfDay; 
  animate?: boolean;
}) {
  const colors = colorPalettes[timeOfDay];
  
  return (
    <svg viewBox="0 0 400 200" className="w-full h-full">
      <defs>
        <linearGradient id={`sky-${timeOfDay}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.skyGradient} />
          <stop offset="100%" stopColor={colors.sky} />
        </linearGradient>
      </defs>
      
      {/* Sky */}
      <rect fill={`url(#sky-${timeOfDay})`} width="400" height="150" />
      
      {/* Sun/Moon */}
      <motion.circle
        cx="320"
        cy={timeOfDay === "morning" ? "100" : timeOfDay === "evening" ? "130" : "50"}
        r={timeOfDay === "night" ? "20" : "25"}
        fill={colors.sun}
        animate={animate ? {
          y: [0, -5, 0],
        } : undefined}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Ground */}
      <rect fill={colors.ground} y="130" width="400" height="70" />
      
      {/* Road */}
      <path
        d={`M 0 200 L 150 150 L 250 150 L 400 200 Z`}
        fill={colors.road}
      />
      
      {/* Road center line */}
      <motion.path
        d="M 180 165 L 220 165 M 240 170 L 280 170 M 300 175 L 340 175"
        stroke="white"
        strokeWidth="2"
        strokeDasharray="20 10"
        fill="none"
        animate={animate ? {
          strokeDashoffset: [0, -30],
        } : undefined}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Simple car silhouette */}
      <motion.g
        animate={animate ? {
          x: [0, 5, 0],
        } : undefined}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <rect x="170" y="140" width="60" height="20" rx="5" fill={colors.accent} />
        <rect x="180" y="130" width="40" height="15" rx="3" fill={colors.accent} />
        {/* Wheels */}
        <circle cx="185" cy="160" r="6" fill="#1a1a1a" />
        <circle cx="215" cy="160" r="6" fill="#1a1a1a" />
      </motion.g>
      
      {/* Stars for night */}
      {timeOfDay === "night" && (
        <>
          <circle cx="50" cy="30" r="1" fill="white" opacity="0.8" />
          <circle cx="100" cy="50" r="1.5" fill="white" opacity="0.6" />
          <circle cx="150" cy="25" r="1" fill="white" opacity="0.9" />
          <circle cx="250" cy="40" r="1.5" fill="white" opacity="0.7" />
          <circle cx="350" cy="60" r="1" fill="white" opacity="0.8" />
        </>
      )}
    </svg>
  );
}

// Abstract pattern illustration
function AbstractIllustration({ 
  timeOfDay 
}: { 
  timeOfDay: TimeOfDay; 
}) {
  const colors = colorPalettes[timeOfDay];
  
  return (
    <svg viewBox="0 0 400 200" className="w-full h-full opacity-30">
      <defs>
        <linearGradient id={`abstract-${timeOfDay}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.accent} stopOpacity="0.3" />
          <stop offset="100%" stopColor={colors.skyGradient} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      
      <circle cx="50" cy="50" r="80" fill={`url(#abstract-${timeOfDay})`} />
      <circle cx="350" cy="150" r="100" fill={`url(#abstract-${timeOfDay})`} />
      <circle cx="200" cy="100" r="60" fill={`url(#abstract-${timeOfDay})`} />
    </svg>
  );
}

export function ThemeIllustration({
  variant = "driving-scene",
  className,
  animate = true,
}: ThemeIllustrationProps) {
  const timeOfDay = useMemo(() => getTimeOfDay(), []);

  return (
    <div className={cn("overflow-hidden", className)}>
      {variant === "driving-scene" && (
        <DrivingSceneIllustration timeOfDay={timeOfDay} animate={animate} />
      )}
      {variant === "abstract" && (
        <AbstractIllustration timeOfDay={timeOfDay} />
      )}
    </div>
  );
}

// Animated car for empty states
export function AnimatedCar({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("relative", className)}
      animate={{
        x: ["-100%", "100%"],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <svg viewBox="0 0 80 40" className="w-16 h-8">
        <rect x="10" y="15" width="60" height="20" rx="5" fill="currentColor" className="text-primary" />
        <rect x="20" y="5" width="40" height="15" rx="3" fill="currentColor" className="text-primary" />
        <circle cx="25" cy="35" r="6" fill="currentColor" className="text-foreground" />
        <circle cx="55" cy="35" r="6" fill="currentColor" className="text-foreground" />
        {/* Windows */}
        <rect x="25" y="8" width="12" height="10" rx="2" fill="currentColor" className="text-sky-300" opacity="0.6" />
        <rect x="42" y="8" width="12" height="10" rx="2" fill="currentColor" className="text-sky-300" opacity="0.6" />
      </svg>
    </motion.div>
  );
}
