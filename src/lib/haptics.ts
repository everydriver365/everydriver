/**
 * Lightweight haptic feedback helper.
 *
 * Uses the Web Vibration API where available (Android Chrome, most PWAs).
 * iOS Safari ignores it silently — that is the intended no-op fallback.
 * If/when Capacitor is added, swap the implementation to @capacitor/haptics
 * without changing call sites.
 */

type Intensity = "light" | "medium" | "heavy" | "selection";

const PATTERNS: Record<Intensity, number | number[]> = {
  selection: 8,
  light: 10,
  medium: 18,
  heavy: 28,
};

export function haptic(intensity: Intensity = "selection"): void {
  try {
    if (typeof navigator === "undefined") return;
    const v = (navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }).vibrate;
    if (typeof v === "function") v.call(navigator, PATTERNS[intensity]);
  } catch {
    // ignore
  }
}
