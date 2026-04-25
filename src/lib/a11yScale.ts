/**
 * Shared accessibility text-scale helper.
 *
 * The instructor app drives a CSS variable `--a11y-text-scale` from
 * AccessibilityContext (values: 0.9 / 1 / 1.18 / 1.35). The root <html>
 * font-size already uses that variable so any rem-based UI scales
 * automatically. However, several legacy tiles use inline `style={{ fontSize:
 * 14 }}` numbers in raw pixels — those don't respond to rem scaling.
 *
 * `a11yPx(14)` returns `"calc(14px * var(--a11y-text-scale, 1))"` so we can
 * keep the existing inline-style structure but make every value scale in
 * lock-step with the user's accessibility setting.
 */
export const a11yPx = (px: number): string =>
  `calc(${px}px * var(--a11y-text-scale, 1))`;
