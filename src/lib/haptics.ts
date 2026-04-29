/**
 * Lightweight haptic feedback helpers.
 *
 * Uses the Web Vibration API where available (Android Chrome, most PWAs).
 * iOS Safari ignores it silently — that is the intended no-op fallback.
 * If/when Capacitor is added, swap the implementations to @capacitor/haptics
 * without changing call sites.
 *
 * Exports:
 *   - `haptics`        — object with named convenience methods (e.g. haptics.medium())
 *   - `triggerHaptic`  — single function accepting an intensity string
 *   - `haptic`         — alias of triggerHaptic for shorter call sites
 */

export type HapticIntensity =
  | "selection"
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error";

const PATTERNS: Record<HapticIntensity, number | number[]> = {
  selection: 8,
  light: 10,
  medium: 18,
  heavy: 28,
  success: [12, 40, 12],
  warning: [18, 60, 18],
  error: [25, 60, 25, 60, 25],
};

function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator === "undefined") return;
    const v = (navigator as Navigator & {
      vibrate?: (p: number | number[]) => boolean;
    }).vibrate;
    if (typeof v === "function") v.call(navigator, pattern);
  } catch {
    // ignore
  }
}

export function triggerHaptic(intensity: HapticIntensity = "selection"): void {
  vibrate(PATTERNS[intensity]);
}

export const haptic = triggerHaptic;

export const haptics = {
  selection: () => vibrate(PATTERNS.selection),
  light: () => vibrate(PATTERNS.light),
  medium: () => vibrate(PATTERNS.medium),
  heavy: () => vibrate(PATTERNS.heavy),
  success: () => vibrate(PATTERNS.success),
  warning: () => vibrate(PATTERNS.warning),
  error: () => vibrate(PATTERNS.error),
};
