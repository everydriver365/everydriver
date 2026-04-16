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
        "bg-white dark:bg-[#1C1C1E] rounded-2xl",
        "ios-card-shadow",
        "ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
        !noPadding && "p-5",
        interactive && "cursor-pointer",
        className
      )}
      whileTap={interactive ? { scale: 0.97 } : undefined}
      transition={interactive ? { type: "spring", stiffness: 400, damping: 25 } : undefined}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
