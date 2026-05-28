/**
 * SwipeToReveal — iOS Mail-style left swipe to reveal a Delete action.
 *
 * - Touch-first (native touch listeners) so it works in iOS WKWebView (Capacitor/Despia).
 *   Falls back to mouse events for desktop/editor preview.
 * - Direction-locked so vertical scrolls pass through.
 * - Snap points: closed (0), open (-actionWidth), full-swipe (auto-trigger past threshold).
 * - Only one row open at a time (global context).
 * - Tapping anywhere closes any open row.
 * - Mobile only (md+ renders children directly).
 * - Respects prefers-reduced-motion.
 * - Optional haptics on snap (Capacitor Haptics if available; no-op on web).
 */

import * as React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Trash2, X, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

// Variant → label / icon / colour class mapping. Keep tokens (no raw hex).
const VARIANTS = {
  delete: { Icon: Trash2, defaultLabel: "Delete", bg: "bg-destructive text-destructive-foreground active:bg-destructive/90" },
  cancel: { Icon: X,      defaultLabel: "Cancel", bg: "bg-amber-500 text-white active:bg-amber-600" },
  archive:{ Icon: Archive,defaultLabel: "Archive",bg: "bg-muted-foreground text-background active:bg-muted-foreground/90" },
} as const;
export type SwipeActionVariant = keyof typeof VARIANTS;

// ───────────────────────── Single-open coordinator ─────────────────────────
type Closer = () => void;
const openersRef = { current: new Set<Closer>() };

function registerOpen(close: Closer) {
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
    const name = "@capacitor/haptics";
    const mod: any = await import(/* @vite-ignore */ name).catch(() => null);
    if (mod?.Haptics?.impact) await mod.Haptics.impact({ style: "LIGHT" });
  } catch {
    /* no-op */
  }
}

// ───────────────────────── Component ─────────────────────────
export interface SwipeToRevealProps {
  onDelete: () => void | Promise<void>;
  actionWidth?: number;
  actionLabel?: string;
  actionVariant?: SwipeActionVariant;
  confirm?: { title: string; body?: string } | null;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function SwipeToReveal({
  onDelete,
  actionWidth = 88,
  actionLabel,
  actionVariant = "delete",
  confirm = null,
  disabled = false,
  className,
  children,
}: SwipeToRevealProps) {
  const variant = VARIANTS[actionVariant];
  const label = actionLabel ?? variant.defaultLabel;
  const Icon = variant.Icon;
  const x = useMotionValue(0);
  const [isOpen, setIsOpen] = React.useState(false);
  const isOpenRef = React.useRef(false);
  const fgRef = React.useRef<HTMLDivElement>(null);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const FULL_SWIPE_THRESHOLD = 0.55;

  React.useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const close = React.useCallback(() => {
    setIsOpen(false);
    isOpenRef.current = false;
    animate(x, 0, { type: prefersReduced ? "tween" : "spring", stiffness: 500, damping: 40 });
  }, [x, prefersReduced]);

  const open = React.useCallback(() => {
    if (isOpenRef.current) return;
    setIsOpen(true);
    isOpenRef.current = true;
    registerOpen(close);
    void lightHaptic();
    animate(x, -actionWidth, { type: prefersReduced ? "tween" : "spring", stiffness: 500, damping: 40 });
  }, [x, actionWidth, prefersReduced, close]);

  React.useEffect(() => () => unregister(close), [close]);

  // Shared gesture state — works for both touch and mouse paths.
  const startXRef = React.useRef(0);
  const startYRef = React.useRef(0);
  const lockedRef = React.useRef<"horizontal" | "vertical" | null>(null);
  const draggingRef = React.useRef(false);

  // Should this gesture start? Mirrors the original skip rules.
  const shouldIgnoreTarget = React.useCallback((target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    if (!el) return true;
    const interactive = el.closest("a,input,textarea,select,[role='button'],[data-no-swipe]");
    if (interactive) return true;
    const leafButton = el.closest("button");
    const passThrough = el.closest("[data-swipe-pass]");
    if (leafButton && !passThrough) return true;
    return false;
  }, []);

  const beginGesture = React.useCallback((clientX: number, clientY: number) => {
    draggingRef.current = true;
    startXRef.current = clientX;
    startYRef.current = clientY;
    lockedRef.current = null;
  }, []);

  const moveGesture = React.useCallback((clientX: number, clientY: number): "horizontal" | "vertical" | "pending" => {
    if (!draggingRef.current) return "pending";
    const dx = clientX - startXRef.current;
    const dy = clientY - startYRef.current;

    if (lockedRef.current === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return "pending";
      lockedRef.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      if (lockedRef.current === "vertical") {
        draggingRef.current = false;
        return "vertical";
      }
    }
    if (lockedRef.current !== "horizontal") return "pending";

    const base = isOpenRef.current ? -actionWidth : 0;
    let next = base + dx;
    if (next > 0) next = next * 0.25;
    x.set(next);
    return "horizontal";
  }, [actionWidth, x]);

  const endGesture = React.useCallback(async () => {
    if (!draggingRef.current && lockedRef.current !== "horizontal") {
      // never engaged or vertical-locked — nothing to do.
      draggingRef.current = false;
      lockedRef.current = null;
      return;
    }
    draggingRef.current = false;
    const wasHorizontal = lockedRef.current === "horizontal";
    lockedRef.current = null;
    if (!wasHorizontal) return;

    const width = fgRef.current?.offsetWidth || 1;
    const current = x.get();

    if (current <= -width * FULL_SWIPE_THRESHOLD) {
      if (confirm) {
        const msg = confirm.body ? `${confirm.title}\n\n${confirm.body}` : confirm.title;
        if (!window.confirm(msg)) {
          close();
          return;
        }
      }
      await animate(x, -width, { duration: 0.18 }).then(() => undefined);
      void lightHaptic();
      try {
        await onDelete();
      } finally {
        unregister(close);
        setIsOpen(false);
        isOpenRef.current = false;
      }
      return;
    }

    if (current <= -actionWidth * 0.4) {
      open();
    } else {
      unregister(close);
      close();
    }
  }, [actionWidth, close, confirm, onDelete, open, x]);

  // ─── Native touch listeners (iOS WKWebView reliable path) ───────────────
  React.useEffect(() => {
    const el = fgRef.current;
    if (!el || disabled) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (shouldIgnoreTarget(e.target)) return;
      const t = e.touches[0];
      beginGesture(t.clientX, t.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!draggingRef.current && lockedRef.current !== "horizontal") return;
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const result = moveGesture(t.clientX, t.clientY);
      if (result === "horizontal" && e.cancelable) {
        // Stop WKWebView from stealing the gesture as a vertical scroll
        // once we've committed to horizontal.
        e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      void endGesture();
    };

    const onTouchCancel = () => {
      draggingRef.current = false;
      lockedRef.current = null;
      // Snap back to current open/closed state.
      animate(x, isOpenRef.current ? -actionWidth : 0, {
        type: prefersReduced ? "tween" : "spring",
        stiffness: 500,
        damping: 40,
      });
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [disabled, shouldIgnoreTarget, beginGesture, moveGesture, endGesture, x, actionWidth, prefersReduced]);

  // ─── Mouse listeners (desktop / editor preview) ─────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    if (shouldIgnoreTarget(e.target)) return;
    beginGesture(e.clientX, e.clientY);

    const onMove = (ev: MouseEvent) => {
      moveGesture(ev.clientX, ev.clientY);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      void endGesture();
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleActionClick = async () => {
    void lightHaptic();
    if (confirm) {
      const msg = confirm.body ? `${confirm.title}\n\n${confirm.body}` : confirm.title;
      if (!window.confirm(msg)) return;
    }
    try {
      await onDelete();
    } finally {
      unregister(close);
      setIsOpen(false);
      isOpenRef.current = false;
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
          aria-label={label}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 focus:outline-none",
            variant.bg,
          )}
        >
          <Icon className="h-5 w-5" />
          <span className="text-[11px] font-semibold">{label}</span>
        </button>
      </motion.div>

      {/* Foreground content layer */}
      <motion.div
        ref={fgRef}
        style={{ x, touchAction: "pan-y" }}
        onMouseDown={onMouseDown}
        className="relative"
      >
        {children}
      </motion.div>
    </div>
  );
}
