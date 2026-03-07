import { useRef, useState, useEffect, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CollapsibleLargeTitleProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  rightContent?: ReactNode;
}

export function CollapsibleLargeTitle({
  title,
  subtitle,
  children,
  className,
  rightContent,
}: CollapsibleLargeTitleProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setCollapsed(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-56px 0px 0px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Sentinel element — when this scrolls out of view, title collapses */}
      <div ref={sentinelRef} className="h-0 w-full" />

      {/* Large title area */}
      <div
        className={cn(
          "px-4 pt-1 pb-2 transition-all duration-200",
          collapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100",
          className
        )}
      >
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight leading-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          {rightContent}
        </div>
        {children}
      </div>
    </>
  );
}
