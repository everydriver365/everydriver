// Haptic feedback utility for mobile interactions
export const haptics = {
  light: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(25);
    }
  },
  heavy: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(50);
    }
  },
  success: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },
  error: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([50, 30, 50, 30, 50]);
    }
  },
  selection: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(5);
    }
  },
};

// Convenience function for triggering haptics by type
export function triggerHaptic(type: "light" | "medium" | "heavy" | "success" | "error" | "selection") {
  haptics[type]();
}

// Hook for long press detection
export function useLongPress(
  callback: () => void,
  options: { delay?: number; onStart?: () => void; onCancel?: () => void } = {}
) {
  const { delay = 500, onStart, onCancel } = options;
  let timeout: NodeJS.Timeout | null = null;
  let triggered = false;

  const start = () => {
    triggered = false;
    onStart?.();
    haptics.light();
    timeout = setTimeout(() => {
      triggered = true;
      haptics.medium();
      callback();
    }, delay);
  };

  const cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    if (!triggered) {
      onCancel?.();
    }
  };

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
  };
}
