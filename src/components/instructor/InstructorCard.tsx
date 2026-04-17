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
        "overflow-hidden",
        !noPadding && "p-5",
        interactive && "cursor-pointer",
        className
      )}
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        borderRadius: 20,
        border: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: '0px 8px 24px rgba(15, 23, 42, 0.06), 0px 2px 6px rgba(15, 23, 42, 0.04)',
      }}
      whileTap={interactive ? {
        scale: 0.98,
        boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.05), 0px 1px 3px rgba(15, 23, 42, 0.03)',
      } : undefined}
      transition={interactive ? { type: "spring", stiffness: 400, damping: 28 } : undefined}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
