import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface InstructorCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  /** Enable scale-0.98 tap animation */
  interactive?: boolean;
  /** Remove default padding */
  noPadding?: boolean;
  className?: string;
}

/**
 * Styled card matching homepage tile aesthetics:
 * - #F2F3F5 bg (light) / #1C1C1E (dark)
 * - 20px border radius
 * - Multi-layer shadow with inset highlight
 * - Optional spring tap animation
 */
export function InstructorCard({
  children,
  interactive = false,
  noPadding = false,
  className,
  ...motionProps
}: InstructorCardProps) {
  return (
    <motion.div
      className={cn(
        "bg-[#F2F3F5] dark:bg-[#1C1C1E] rounded-none",
        "shadow-[0px_8px_20px_rgba(0,0,0,0.08),0px_2px_6px_rgba(0,0,0,0.04)]",
        "dark:shadow-[0px_8px_20px_rgba(0,0,0,0.3),0px_2px_6px_rgba(0,0,0,0.15)]",
        // Inset highlight for depth
        "ring-1 ring-inset ring-white/60 dark:ring-white/5",
        !noPadding && "p-5",
        interactive && "cursor-pointer transition-transform active:scale-[0.98]",
        className
      )}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
