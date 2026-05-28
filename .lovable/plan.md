## Problem
On the Despia TestFlight build (WKWebView), left-swipe-to-Cancel on Schedule rows never fires. `SwipeToReveal` uses Pointer Events + `setPointerCapture` on a `<motion.div>` wrapping a native `<button data-swipe-pass>`. In iOS WKWebView, calling `setPointerCapture` on a parent in response to a `pointerdown` originating inside a native `<button>` is silently ignored, so subsequent `pointermove`/`pointerup` never reach the handler — the row doesn't translate at all. Works fine in mobile Safari and the Lovable preview, which is why it shipped.

Affects every consumer of `SwipeToReveal` (Schedule rows via `NewMobileScheduleView`, document rows via `DocumentVault`).

## Fix
Rewrite only the gesture layer in `src/components/ui/SwipeToReveal.tsx`. No public API changes, no caller changes.

- Replace `onPointerDown/Move/Up/Cancel` with native `touchstart` / `touchmove` / `touchend` / `touchcancel` listeners attached imperatively in `useEffect` on the foreground element. Register `touchmove` with `{ passive: false }` so we can `preventDefault()` once horizontal lock is confirmed (prevents the WKWebView from stealing the gesture as a vertical scroll).
- Drop `setPointerCapture` entirely; track the gesture in refs.
- Keep a separate `mousedown/mousemove/mouseup` path on `window` for desktop/editor preview so swipe still works there.
- Preserve every existing behaviour: 6 px direction lock, vertical-pass-through, right-drag rubber band, 55 % full-swipe threshold, snap-to-open at 40 % of `actionWidth`, single-open coordinator, prefers-reduced-motion, optional Capacitor haptic.
- Preserve the existing skip rules: ignore gestures starting on `a, input, textarea, select, [role='button'], [data-no-swipe]`, and on any inner `<button>` that is not inside `[data-swipe-pass]`.

## Verification
- Lovable preview: left-swipe a schedule row reveals Cancel; full-swipe confirms delete; vertical scroll on a row still scrolls the list (lock intact); tap outside closes any open row.
- Despia TestFlight: same behaviours work on Schedule and on `DocumentVault` rows; light haptic fires on snap.
- No regressions in `DocumentVault` or any other current consumer.

## Files touched
- `src/components/ui/SwipeToReveal.tsx` — gesture layer rewrite only.

No DB migrations, no edge functions, no other components.
