import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  intensity?: "light" | "medium" | "strong";
  gradient?: boolean;
  glow?: boolean;
  interactive?: boolean;
  className?: string;
}

const intensityStyles = {
  light: "backdrop-blur-md bg-card/60 dark:bg-card/40",
  medium: "backdrop-blur-xl bg-card/70 dark:bg-card/50",
  strong: "backdrop-blur-2xl bg-card/80 dark:bg-card/60",
};

const glowStyles = {
  light: "shadow-[0_4px_20px_rgba(0,0,0,0.05)]",
  medium: "shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
  strong: "shadow-[0_12px_40px_rgba(0,0,0,0.12)]",
};

export function GlassCard({
  children,
  intensity = "medium",
  gradient = false,
  glow = false,
  interactive = false,
  className,
  ...motionProps
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        // Base glass effect
        intensityStyles[intensity],
        // Border styling
        "border border-white/20 dark:border-white/10",
        // Shadow based on intensity
        glowStyles[intensity],
        // Rounded corners
        "rounded-2xl",
        // Gradient overlay
        gradient && "bg-gradient-to-br from-white/5 to-transparent",
        // Glow effect
        glow && "ring-1 ring-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)]",
        // Interactive states
        interactive && [
          "cursor-pointer transition-all duration-200",
          "hover:scale-[1.02] hover:shadow-lg",
          "active:scale-[0.98]",
        ],
        className
      )}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}

// Compact variant for smaller cards/chips
interface GlassChipProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function GlassChip({ children, active = false, onClick, className }: GlassChipProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium",
        "backdrop-blur-md transition-all duration-200",
        "border",
        active
          ? "bg-primary/20 border-primary/40 text-primary"
          : "bg-card/60 border-white/20 dark:border-white/10 text-foreground/80 hover:bg-card/80",
        "active:scale-95",
        className
      )}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
}

// Section wrapper with optional glass effect
interface GlassSectionProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function GlassSection({ children, title, subtitle, className }: GlassSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {(title || subtitle) && (
        <div className="px-1">
          {title && (
            <h3 className="font-semibold text-foreground text-sm">{title}</h3>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      )}
      <GlassCard intensity="medium" className="p-4">
        {children}
      </GlassCard>
    </div>
  );
}
