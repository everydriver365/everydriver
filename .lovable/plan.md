## Problem

Sections on `/` use inconsistent inner widths:

- `Drive365Home` blocks: `max-width: 1200px` centered
- `HomepageLiveStats`: `max-width: 1200px` centered (already correct)
- "What's Included" white card in `src/pages/Index.tsx`: no max-width — stretches to viewport minus 10% padding (≈1130px at 1255 viewport, but unbounded on wider screens)
- `PupilReviewsSection`: no max-width and `padding: 48px 40px` — spans full viewport edge-to-edge

Result: each band visually has a different content width.

## Fix (layout/CSS only, no copy or logic changes)

1. **`src/pages/Index.tsx` — "What's Included" section (~line 335-341)**
   Wrap the white card so it is centered at 1200px:
   - Add `maxWidth: 1200, margin: "0 auto", width: "100%"` to the white card `<div>` style.

2. **`src/components/home/PupilReviewsSection.tsx`**
   - Change outer section padding from `48px 40px` to `48px 5%` (match other sections' horizontal rhythm).
   - Wrap the inner header + grid in a `<div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>` so the content aligns with the rest of the page.

No other components, copy, click handlers, data, or mobile layouts are touched.
