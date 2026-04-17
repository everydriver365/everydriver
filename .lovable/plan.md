

## Why the Quick Access tiles look "on a background"

Looking at `SwipeableQuickAccess.tsx` lines 103 and 106:

```tsx
<div ref={emblaRef} className="overflow-hidden -mx-2 px-2 -my-3 py-3">
  <div className="flex">
    {pages.map((page, pageIdx) => (
      <div key={pageIdx} className="flex-[0_0_100%] min-w-0 px-1">
```

There are **two stacked padding/margin layers** that create the visual "frame" effect:

1. **Embla viewport** uses `-my-3 py-3` (vertical) and `-mx-2 px-2` (horizontal). This was added earlier so tile shadows wouldn't get clipped by `overflow-hidden`.
2. **Each carousel slide** uses `px-1` for spacing between pages.

Combined with the **heavy drop shadow** on each tile (`0 12px 28px rgba(20, 30, 60, 0.14)` — line 140), the tiles cast a dark, layered shadow onto the page bg. The Insight tiles use the same shadow but sit in a plain `grid` with no nested padded carousel wrapper, so they look flatter and cleaner.

So it's not a real background — it's the **shadow blooming inside the padded carousel viewport**, making the area behind look slightly darker / framed.

### Fix

Lighten the tile shadow to match the activity/insight tiles' visual weight. The Insights grid uses the same shadow value, but the issue is more visible on Quick Access because there are 6 tiles densely packed inside a padded carousel.

Two options:

**A. Reduce shadow intensity (recommended)** — drop from `rgba(20,30,60,0.14)` to `rgba(20,30,60,0.06)` and second layer from `0.06` to `0.03`. Matches the lighter, flatter look elsewhere.

**B. Match Insights exactly** — Insights uses the identical shadow, so if the user wants them to look identical, no change needed there. The "background" perception is purely from the carousel's padded viewport. We could remove `-my-3 py-3` and instead allow horizontal-only shadow space (`-mx-2 px-2` only), accepting minor vertical clipping — usually invisible since shadow is mostly bottom.

### Recommendation

Go with **A** (lighter shadow on Quick Access tiles). Keeps shadow space intact, removes the heavy "framed" look, and makes Quick Access visually match Insight tiles which have the same dimensions but feel airier in a static grid.

### File touched

- `src/components/instructor/SwipeableQuickAccess.tsx` — soften `boxShadow` on the `motion.button` style (line 140).

