## Problem

On `/booking/chapmans` (mobile), the search card crushes Postcode, Radius, Transmission and the Search button into a single horizontal row. Labels are clipped ("POSTCO…", "RADIUS", "TRANS…") and the input is unusable.

Root cause: the `chapmans` variant in `src/components/courses/CourseSearchHeader.tsx` (lines ~106–302) hard-codes `display: flex; flex-direction: row` via inline styles, so it never stacks. The default variant already stacks correctly using `flex-col md:flex-row`.

## Fix (single file)

Edit **`src/components/courses/CourseSearchHeader.tsx`** — the `isChapmans` branch only.

1. Replace the inline `style={{ display: "flex", alignItems: "center", gap: 10, ... }}` on the `<form>` with Tailwind classes that stack on mobile and become a row at `sm:` and up:
   - container: `flex flex-col sm:flex-row sm:items-center gap-2.5` (keep the white bg, 14px radius, padding 16, shadow as before)
2. Remove the inline `flex: 1.5 / 1 / 1` from the three field wrappers and replace with classes:
   - Postcode field: `w-full sm:flex-[1.5] min-w-0`
   - Radius + Transmission fields: `w-full sm:flex-1 min-w-0`
3. Search button: make it `w-full sm:w-auto` and `justify-center` so it spans the row on mobile; keep the orange `#E8641A` styling. Also bump tap target padding slightly on mobile (`py-3`) for usability.
4. Keep all colors, font sizes, label styling, icons, and behaviour identical — purely a responsive layout change.

No other files, no behaviour changes, no routing changes, no payment changes. Default variant and all other pages (`/courses`, `/embed/courses`, Intensives, SemiIntensive) are untouched.

## Verification

- Load `/booking/chapmans` at 390×844: Postcode, Radius, Transmission and Search button stack vertically full-width; labels readable, input usable.
- Load `/booking/chapmans` at ≥640px: layout returns to the existing single-row design.
- Spot-check `/booking/chapmans` on desktop and a non-chapmans booking page to confirm no regression.
