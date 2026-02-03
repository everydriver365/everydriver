import { useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { 
  Clock, 
  AlertCircle, 
  Calendar, 
  GraduationCap, 
  Pause,
  PoundSterling
} from "lucide-react";

type AvatarStatus = "today" | "owes" | "test-soon" | "high-progress" | "on-hold" | "default";

interface SmartAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  // Status indicators
  hasLessonToday?: boolean;
  owesAmount?: number;
  testDateSoon?: boolean; // Within 7 days
  progressPercent?: number;
  isOnHold?: boolean;
  className?: string;
  showBadge?: boolean;
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-lg",
  lg: "h-16 w-16 text-xl",
  xl: "h-20 w-20 text-2xl",
};

const ringClasses = {
  xs: "ring-[2px]",
  sm: "ring-2",
  md: "ring-[3px]",
  lg: "ring-4",
  xl: "ring-4",
};

const badgeSizeClasses = {
  xs: "h-3 w-3 -bottom-0.5 -right-0.5",
  sm: "h-4 w-4 -bottom-0.5 -right-0.5",
  md: "h-5 w-5 -bottom-1 -right-1",
  lg: "h-6 w-6 -bottom-1 -right-1",
  xl: "h-7 w-7 -bottom-1.5 -right-1.5",
};

const badgeIconSizes = {
  xs: "h-1.5 w-1.5",
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-3.5 w-3.5",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function determineStatus(props: SmartAvatarProps): AvatarStatus {
  const { hasLessonToday, owesAmount, testDateSoon, progressPercent, isOnHold } = props;
  
  // Priority order: owes > test-soon > today > high-progress > on-hold > default
  if (owesAmount && owesAmount < 0) return "owes";
  if (testDateSoon) return "test-soon";
  if (hasLessonToday) return "today";
  if (progressPercent && progressPercent >= 85) return "high-progress";
  if (isOnHold) return "on-hold";
  return "default";
}

const statusConfig: Record<AvatarStatus, {
  ringColor: string;
  badgeColor: string;
  icon: React.ElementType;
  pulse?: boolean;
  label: string;
}> = {
  today: {
    ringColor: "ring-emerald-500",
    badgeColor: "bg-emerald-500",
    icon: Clock,
    label: "Lesson today",
  },
  owes: {
    ringColor: "ring-destructive",
    badgeColor: "bg-destructive",
    icon: PoundSterling,
    label: "Payment due",
  },
  "test-soon": {
    ringColor: "ring-amber-500",
    badgeColor: "bg-amber-500",
    icon: Calendar,
    pulse: true,
    label: "Test approaching",
  },
  "high-progress": {
    ringColor: "ring-blue-500",
    badgeColor: "bg-blue-500",
    icon: GraduationCap,
    label: "High progress",
  },
  "on-hold": {
    ringColor: "ring-muted-foreground/50",
    badgeColor: "bg-muted-foreground",
    icon: Pause,
    label: "On hold",
  },
  default: {
    ringColor: "ring-transparent",
    badgeColor: "bg-transparent",
    icon: Clock,
    label: "",
  },
};

export function SmartAvatar({
  name,
  imageUrl,
  size = "md",
  hasLessonToday,
  owesAmount,
  testDateSoon,
  progressPercent,
  isOnHold,
  className,
  showBadge = true,
}: SmartAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const status = determineStatus({ 
    name, 
    imageUrl, 
    hasLessonToday, 
    owesAmount, 
    testDateSoon, 
    progressPercent, 
    isOnHold 
  });
  
  const config = statusConfig[status];
  const BadgeIcon = config.icon;
  const showStatusRing = status !== "default";
  const showStatusBadge = showBadge && status !== "default";

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Pulsing ring for test-soon status */}
      {config.pulse && showStatusRing && (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full ring-amber-500",
            ringClasses[size]
          )}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ 
            boxShadow: "0 0 0 3px hsl(var(--warning) / 0.3)" 
          }}
        />
      )}
      
      {/* Main Avatar */}
      <Avatar 
        className={cn(
          sizeClasses[size],
          "shrink-0 transition-all duration-200",
          showStatusRing && ringClasses[size],
          showStatusRing && config.ringColor,
        )}
      >
        {imageUrl && !imageError ? (
          <AvatarImage 
            src={imageUrl} 
            alt={name} 
            onError={() => setImageError(true)}
          />
        ) : null}
        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>

      {/* Status Badge */}
      {showStatusBadge && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "absolute flex items-center justify-center rounded-full",
            "text-white shadow-sm border-2 border-background",
            badgeSizeClasses[size],
            config.badgeColor
          )}
          title={config.label}
        >
          <BadgeIcon className={cn(badgeIconSizes[size])} />
        </motion.div>
      )}
    </div>
  );
}

// Minimal version without badges for compact spaces
export function SmartAvatarRing({
  name,
  imageUrl,
  size = "sm",
  status,
  className,
}: {
  name: string;
  imageUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  status: AvatarStatus;
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);
  const config = statusConfig[status];

  return (
    <Avatar 
      className={cn(
        sizeClasses[size],
        "shrink-0",
        status !== "default" && ringClasses[size],
        status !== "default" && config.ringColor,
        className
      )}
    >
      {imageUrl && !imageError ? (
        <AvatarImage 
          src={imageUrl} 
          alt={name} 
          onError={() => setImageError(true)}
        />
      ) : null}
      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
