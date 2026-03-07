import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DrawCheckmarkProps {
  size?: number;
  className?: string;
  color?: string;
  delay?: number;
}

export function DrawCheckmark({
  size = 48,
  className,
  color = "hsl(var(--success))",
  delay = 0,
}: DrawCheckmarkProps) {
  return (
    <div className={cn("inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 52 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Circle */}
        <motion.circle
          cx="26"
          cy="26"
          r="24"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay, ease: "easeOut" }}
        />
        {/* Checkmark */}
        <motion.path
          d="M15 27L22.5 34.5L37 18"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: delay + 0.3, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}
