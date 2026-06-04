## Goal
Make the "Choose your learning path" section on the Drive365 homepage more compact by trimming content and tightening spacing.

## Changes
In `src/components/home/Drive365Home.tsx`, section starting at line 480:

### 1. Trim card content
- Remove the `<p>` description paragraph from each course card.
- Remove the 3-item feature list (the checkmark bullets).
- Keep: badge, image, title, price, CTA button.

### 2. Compact card sizing
- Reduce `CourseCardImage` height from `180` to `140`.
- Reduce inner card padding from `"22px 22px 0"` to `"18px 18px 0"`.
- Reduce bottom padding on the price row.
- Reduce CTA button padding from `14` to `10`.

### 3. Tighten section spacing
- Reduce section top/bottom padding from `"56px 5%"` to `"36px 5%"`.
- Keep the existing 3-column grid and card border/shadow styling.

## What stays the same
- All data from the `COURSES` array (titles, prices, CTAs, images, badges).
- Existing grid layout (`repeat(auto-fit, minmax(280px, 1fr))`).
- Card border, featured-card highlight, and hover states.
- No changes to other sections or components.