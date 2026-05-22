import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform, useMotionValue } from "framer-motion";
import { formatCurrencyCompact } from "@/lib/formatters";


interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 0.8,
  decimals = 0,
  className = "",
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  
  // Use framer-motion spring for smooth animation
  const motionValue = useMotionValue(previousValue.current);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
    mass: 0.5,
  });

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (prefersReducedMotion) {
      setDisplayValue(value);
      previousValue.current = value;
      return;
    }

    // Animate to new value
    motionValue.set(value);
    previousValue.current = value;
  }, [value, motionValue]);

  // Subscribe to spring changes
  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (decimals > 0) {
        setDisplayValue(parseFloat(latest.toFixed(decimals)));
      } else {
        setDisplayValue(Math.round(latest));
      }
    });

    return unsubscribe;
  }, [springValue, decimals]);

  return (
    <motion.span
      className={className}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 0.2 }}
      key={value}
    >
      {prefix}{displayValue.toLocaleString()}{suffix}
    </motion.span>
  );
}

// Compact version for tight spaces
interface CompactCounterProps {
  value: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function CompactCounter({ value, size = "md", className = "" }: CompactCounterProps) {
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <AnimatedCounter
      value={value}
      className={`font-bold tabular-nums ${sizeClasses[size]} ${className}`}
    />
  );
}

// Currency counter with pound sign
interface CurrencyCounterProps {
  value: number;
  showPence?: boolean;
  className?: string;
}

export function CurrencyCounter({ value, showPence = false, className = "" }: CurrencyCounterProps) {
  // For values above £9,999, use the no-decimal compact formatter (e.g. "£12k")
  // to keep tile widths consistent.
  if (Math.abs(value) > 9_999) {
    return (
      <motion.span
        className={className}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.2 }}
        key={value}
      >
        {formatCurrencyCompact(value, { decimals: false })}
      </motion.span>
    );
  }
  return (
    <AnimatedCounter
      value={value}
      prefix="£"
      decimals={showPence ? 2 : 0}
      className={className}
    />
  );
}


// Percentage counter
interface PercentCounterProps {
  value: number;
  className?: string;
}

export function PercentCounter({ value, className = "" }: PercentCounterProps) {
  return (
    <AnimatedCounter
      value={value}
      suffix="%"
      className={className}
    />
  );
}
