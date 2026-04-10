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
        "bg-white dark:bg-[#1C1C1E] rounded-[20px]",
        "shadow-[0px_8px_20px_rgba(0,0,0,0.08),0px_2px_6px_rgba(0,0,0,0.04)]",
        "dark:shadow-[0px_8px_20px_rgba(0,0,0,0.3),0px_2px_6px_rgba(0,0,0,0.15)]",
        "ring-1 ring-inset ring-white/60 dark:ring-white/5",
        interactive && [
          "cursor-pointer transition-all duration-200",
          "hover:shadow-md",
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
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-full",
        active
          ? "bg-primary/10 ring-1 ring-primary/30 text-primary"
          : "bg-white dark:bg-[#1C1C1E] ring-1 ring-inset ring-white/60 dark:ring-white/5 text-foreground/80 hover:bg-muted/50",
        "active:scale-95",
        className
      )}
    >
      {children}
    </button>
  );
}

// Section wrapper
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
            <h3 className="font-medium text-foreground text-sm">{title}</h3>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      )}
      <GlassCard className="p-5">
        {children}
      </GlassCard>
    </div>
  );
}
