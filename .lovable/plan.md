## Fix: rounded hero image on Drive365 homepage

**Problem:** The hero image on `/drive365` still shows square corners despite `rounded-3xl` + `overflow-hidden` being on the wrapper.

**Likely cause:** The `<img>` is `absolute inset-0` inside the wrapper. In some Safari/WebKit cases (and behind certain transforms) the absolute child can paint past the parent's rounded clip. Also the floating badge cards (`98% Fill rate`, `500+ Active instructors`) sit outside the wrapper so they look fine, but the image itself isn't being visibly clipped.

**Fix in `src/components/homepage/HeroSearchSection.tsx`:**

1. Apply `rounded-3xl` directly to the `<img>` as well as the wrapper, so it's rounded even if clipping fails.
2. Add `isolate` + `transform-gpu` to the wrapper to force a new stacking/paint context that respects `overflow-hidden` reliably.
3. Keep `overflow-hidden rounded-3xl` on the wrapper.

That's the only change — pure CSS class adjustments, no layout or behavior changes.
