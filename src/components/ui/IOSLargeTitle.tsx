import { useRef, useState, useEffect, ReactNode } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { cn } from "@/lib/utils";

interface IOSLargeTitleProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  scrollContainerRef?: React.RefObject<HTMLElement>;
  className?: string;
}

/**
 * iOS-style large title that shrinks into an inline header on scroll.
 * Mimics the iOS Settings / Contacts navigation bar behavior.
 */
export function IOSLargeTitle({
  title,
  subtitle,
  action,
  scrollContainerRef,
  className,
}: IOSLargeTitleProps) {
  const [collapsed, setCollapsed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setCollapsed(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-1px 0px 0px 0px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn("relative", className)}>
      {/* Collapsed inline header — sticky */}
      <motion.div
        initial={false}
        animate={{
          opacity: collapsed ? 1 : 0,
          y: collapsed ? 0 : -8,
          height: collapsed ? "auto" : 0,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border overflow-hidden pointer-events-auto"
        style={{ pointerEvents: collapsed ? "auto" : "none" }}
      >
        <div className="px-4 py-2.5 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-foreground">{title}</h2>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </motion.div>

      {/* Sentinel for intersection observer */}
      <div ref={sentinelRef} className="h-px" />

      {/* Large title */}
      <div className="px-1 pt-1 pb-2 flex items-end justify-between">
        <div>
          <h1 className="text-[34px] font-bold text-foreground leading-tight tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[15px] text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && (
          <motion.div
            animate={{ opacity: collapsed ? 0 : 1 }}
            transition={{ duration: 0.15 }}
            className="shrink-0"
          >
            {action}
          </motion.div>
        )}
      </div>
    </div>
  );
}
