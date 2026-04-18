import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface PremiumStatTileProps {
  label: string;
  value: string | number;
  /** Used as the AnimatePresence key — change to trigger spring animation */
  animateKey?: string | number;
  color?: string;
  icon?: ReactNode;
  className?: string;
}

/**
 * Premium summary tile with spring-animated value transitions and tabular figures.
 * Drop-in replacement for static stat cards.
 */
export function PremiumStatTile({
  label,
  value,
  animateKey,
  color,
  icon,
  className,
}: PremiumStatTileProps) {
  const key = animateKey ?? value;
  return (
    <div
      className={`shadow-premium ${className ?? ""}`}
      style={{
        background: "#FFFFFF",
        border: "0.5px solid rgba(15,23,42,0.06)",
        borderRadius: 12,
        padding: "10px 12px",
      }}
    >
      <div className="flex items-center gap-1 label-premium" style={{ color: "#71717A" }}>
        {icon}
        {label}
      </div>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={key}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className="tabular-nums"
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: color ?? "#18181B",
            marginTop: 2,
            letterSpacing: "-0.01em",
          }}
        >
          {value}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
