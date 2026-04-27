import { useCallback, useRef } from "react";
import { triggerHaptic } from "@/lib/haptics";

interface Options {
  delay?: number;
  moveTolerance?: number;
  onLongPress: () => void;
  onClick?: () => void;
}

/**
 * Generic long-press detector for touch + mouse.
 * - Fires onLongPress after `delay` ms (default 500).
 * - Cancels if pointer moves > moveTolerance px or scrolls.
 * - If onLongPress fires, the subsequent click is suppressed.
 */
export function useLongPress({ delay = 500, moveTolerance = 8, onLongPress, onClick }: Options) {
  const timer = useRef<number | null>(null);
  const fired = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const begin = useCallback(
    (x: number, y: number) => {
      fired.current = false;
      start.current = { x, y };
      clear();
      timer.current = window.setTimeout(() => {
        fired.current = true;
        triggerHaptic("medium");
        onLongPress();
      }, delay);
    },
    [clear, delay, onLongPress],
  );

  const move = useCallback(
    (x: number, y: number) => {
      if (!start.current) return;
      const dx = Math.abs(x - start.current.x);
      const dy = Math.abs(y - start.current.y);
      if (dx > moveTolerance || dy > moveTolerance) clear();
    },
    [clear, moveTolerance],
  );

  const end = useCallback(() => {
    clear();
    start.current = null;
  }, [clear]);

  return {
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches[0];
      if (t) begin(t.clientX, t.clientY);
    },
    onTouchMove: (e: React.TouchEvent) => {
      const t = e.touches[0];
      if (t) move(t.clientX, t.clientY);
    },
    onTouchEnd: end,
    onTouchCancel: end,
    onMouseDown: (e: React.MouseEvent) => begin(e.clientX, e.clientY),
    onMouseMove: (e: React.MouseEvent) => move(e.clientX, e.clientY),
    onMouseUp: end,
    onMouseLeave: end,
    onContextMenu: (e: React.MouseEvent) => {
      // Prevent the OS context menu when long-pressing on touch devices that
      // also fire contextmenu, since we already handled the gesture.
      if (fired.current) e.preventDefault();
    },
    onClick: () => {
      if (fired.current) {
        // Suppress the synthetic click that follows a long-press.
        fired.current = false;
        return;
      }
      onClick?.();
    },
  };
}
