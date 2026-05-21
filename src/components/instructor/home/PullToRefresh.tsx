/**
 * Lightweight touch-driven pull-to-refresh.
 * - No dependencies. Works inside the page's normal scroll container.
 * - Only activates when scrollTop === 0 and the user pulls down.
 * - Releases past `threshold` → fires `onRefresh()` (awaited).
 * - Shows a small spinner inside the safe-area while refreshing.
 *
 * Designed for the instructor mobile home. Safe to use on desktop too
 * (no-op for mouse users — only listens to touch events).
 */

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

type Props = {
  onRefresh: () => Promise<unknown> | unknown;
  children: React.ReactNode;
  threshold?: number;
  maxPull?: number;
};

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 70,
  maxPull = 110,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const getScrollParent = () => {
      // Pull only fires when the *page* is at the top.
      // Walk up to the nearest scrollable ancestor.
      let n: HTMLElement | null = el;
      while (n) {
        const oy = getComputedStyle(n).overflowY;
        if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight) {
          return n;
        }
        n = n.parentElement;
      }
      return document.scrollingElement as HTMLElement | null;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing) return;
      const sp = getScrollParent();
      if (!sp || sp.scrollTop > 0) return;
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pullingRef.current || startYRef.current == null) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy <= 0) {
        setOffset(0);
        return;
      }
      // Rubber-band the pull so it eases as it grows.
      const eased = Math.min(maxPull, dy * 0.5);
      setOffset(eased);
      if (eased > 4 && e.cancelable) e.preventDefault();
    };

    const onTouchEnd = async () => {
      if (!pullingRef.current) return;
      pullingRef.current = false;
      startYRef.current = null;
      if (offset >= threshold && !refreshing) {
        setRefreshing(true);
        setOffset(48);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setOffset(0);
        }
      } else {
        setOffset(0);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [offset, refreshing, onRefresh, threshold, maxPull]);

  const indicatorOpacity = Math.min(1, offset / threshold);
  const indicatorRotation = Math.min(180, (offset / threshold) * 180);

  return (
    <div ref={wrapRef} style={{ position: "relative", minHeight: "100%" }}>
      {/* Indicator pinned just under safe-area */}
      <div
        aria-hidden={!offset && !refreshing}
        style={{
          position: "absolute",
          top: "calc(env(safe-area-inset-top, 0px) + 6px)",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          opacity: indicatorOpacity,
          transition: refreshing ? "opacity 200ms ease" : undefined,
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: "rgba(255,255,255,0.95)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {refreshing ? (
            <Loader2 size={16} color="#1A52A0" className="animate-spin" strokeWidth={2.4} />
          ) : (
            <div
              style={{
                transform: `rotate(${indicatorRotation}deg)`,
                transition: "transform 120ms ease",
                color: "#1A52A0",
                fontSize: 14,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              ↓
            </div>
          )}
        </div>
      </div>

      {/* Content shifts down with the pull */}
      <div
        style={{
          transform: `translateY(${offset}px)`,
          transition: pullingRef.current ? undefined : "transform 220ms cubic-bezier(.2,.8,.2,1)",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
