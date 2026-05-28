/**
 * SwipeToReveal — iOS Mail-style left swipe to reveal a Delete action.
 *
 * - Touch-first (also supports mouse), direction-locked so vertical scrolls pass through.
 * - Snap points: closed (0), open (-actionWidth), full-swipe (auto-trigger past threshold).
 * - Only one row open at a time (global context).
 * - Tapping anywhere closes any open row.
 * - Mobile only (md+ renders children directly).
 * - Respects prefers-reduced-motion.
 * - Optional haptics on snap (Capacitor Haptics if available; no-op on web).
 */

import * as React from "react";
import { motion, useMotionValue, useAnimation, useTransform, animate } from "framer-motion";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ───────────────────────── Single-open coordinator ─────────────────────────
type Closer = () => void;
const openersRef = { current: new Set<Closer>() };

function registerOpen(close: Closer) {
  // Close any other open row before this one opens.
  openersRef.current.forEach((c) => {
    if (c !== close) c();
  });
  openersRef.current.add(close);
}
function unregister(close: Closer) {
  openersRef.current.delete(close);
}

// Close all on any outside tap / scroll.
if (typeof window !== "undefined") {
  const closeAll = () => openersRef.current.forEach((c) => c());
  window.addEventListener("scroll", closeAll, { passive: true, capture: true });
  window.addEventListener("touchstart", (e) => {
    const t = e.target as HTMLElement | null;
    if (!t?.closest("[data-swipe-reveal]")) closeAll();
  }, { passive: true });
  window.addEventListener("mousedown", (e) => {
    const t = e.target as HTMLElement | null;
    if (!t?.closest("[data-swipe-reveal]")) closeAll();
  });
}

// ───────────────────────── Haptics (optional) ─────────────────────────
async function lightHaptic() {
  try {
    // Dynamic import via variable so TS doesn't require the type when the
    // native module isn't installed. No-op in web builds.
    const name = "@capacitor/haptics";
    const mod: any = await import(/* @vite-ignore */ name).catch(() => null);
    if (mod?.Haptics?.impact) await mod.Haptics.impact({ style: "LIGHT" });
  } catch {
    /* no-op */
  }
}

// ───────────────────────── Component ─────────────────────────
export interface SwipeToRevealProps {
  /** Called after the user confirms (full swipe OR tap on Delete). */
  onDelete: () => void | Promise<void>;
  /** Resting reveal width in pixels. iOS default ≈ 88. */
  actionWidth?: number;
  /** Label on the action button. */
  actionLabel?: string;
  /** Disable the swipe behaviour entirely (renders children only). */
  disabled?: boolean;
  /** Wrapper className passthrough. */
  className?: string;
  children: React.ReactNode;
}

export function SwipeToReveal({
  onDelete,
  actionWidth = 88,
  actionLabel = "Delete",
  disabled = false,
  className,
  children,
}: SwipeToRevealProps) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const [isOpen, setIsOpen] = React.useState(false);
  const startXRef = React.useRef(0);
  const startYRef = React.useRef(0);
  const lockedRef = React.useRef<"horizontal" | "vertical" | null>(null);
  const draggingRef = React.useRef(false);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const FULL_SWIPE_THRESHOLD = 0.55; // proportion of container width

  const close = React.useCallback(() => {
    setIsOpen(false);
    animate(x, 0, { type: prefersReduced ? "tween" : "spring", stiffness: 500, damping: 40 });
  }, [x, prefersReduced]);

  const open = React.useCallback(() => {
    if (isOpen) return;
    setIsOpen(true);
    registerOpen(close);
    void lightHaptic();
    animate(x, -actionWidth, { type: prefersReduced ? "tween" : "spring", stiffness: 500, damping: 40 });
  }, [x, actionWidth, prefersReduced, close, isOpen]);

  React.useEffect(() => () => unregister(close), [close]);

  // Pointer handlers (touch + mouse via Pointer Events).
  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    // Don't start a swipe from interactive children.
    const target = e.target as HTMLElement;
    const interactive = target.closest("a,input,textarea,select,[role='button'],[data-no-swipe]");
    const leafButton = target.closest("button");
    const passThrough = target.closest("[data-swipe-pass]");
    if (interactive) return;
    if (leafButton && !passThrough) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    lockedRef.current = null;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || disabled) return;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    // Direction lock after 6px of movement.
    if (lockedRef.current === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      lockedRef.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      if (lockedRef.current === "vertical") {
        draggingRef.current = false;
        return;
      }
    }
    if (lockedRef.current !== "horizontal") return;

    // Translate. Only left-drag past 0; small right-drag rubber-bands.
    const base = isOpen ? -actionWidth : 0;
    let next = base + dx;
    if (next > 0) next = next * 0.25;
    x.set(next);
  };

  const onPointerUp = async (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try { (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId); } catch {}

    const width = (e.currentTarget as HTMLElement).offsetWidth || 1;
    const current = x.get();

    if (current <= -width * FULL_SWIPE_THRESHOLD) {
      // Full swipe — trigger delete, animate out.
      await animate(x, -width, { duration: 0.18 }).then(() => undefined);
      void lightHaptic();
      try {
        await onDelete();
      } finally {
        unregister(close);
        setIsOpen(false);
      }
      return;
    }

    if (current <= -actionWidth * 0.4) {
      open();
    } else {
      unregister(close);
      close();
    }
  };

  const handleActionClick = async () => {
    void lightHaptic();
    try {
      await onDelete();
    } finally {
      unregister(close);
      setIsOpen(false);
      x.set(0);
    }
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      data-swipe-reveal
      className={cn("relative overflow-hidden rounded-2xl", className)}
    >
      {/* Action layer (behind) — hidden at rest, fades in as the user drags */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-stretch"
        style={{
          width: actionWidth,
          opacity: useTransform(x, [-actionWidth * 0.1, 0], [1, 0], { clamp: true }),
          pointerEvents: isOpen ? "auto" : "none",
        }}
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          onClick={handleActionClick}
          tabIndex={isOpen ? 0 : -1}
          aria-label={actionLabel}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-destructive text-destructive-foreground active:bg-destructive/90 focus:outline-none"
        >
          <Trash2 className="h-5 w-5" />
          <span className="text-[11px] font-semibold">{actionLabel}</span>
        </button>
      </motion.div>

      {/* Foreground content layer */}
      <motion.div
        animate={controls}
        style={{ x }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
