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
        "shadow-premium hover:shadow-premium-lg transition-shadow duration-200 tabular-nums",
        !noPadding && "p-5",
        interactive && "cursor-pointer",
        className
      )}
      style={{ backgroundColor: '#FFFFFF', borderRadius: 16 }}
      whileTap={interactive ? { scale: 0.97 } : undefined}
      transition={interactive ? { type: "spring", stiffness: 400, damping: 25 } : undefined}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
