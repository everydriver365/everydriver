

# Instructor Mobile Home Page - Layout and Design Improvements

## Current State

The home page currently has a good foundation but feels dense and slightly fragmented. The hero image with overlapping card works well, but the sections below (YOUR DAY, QUICK ACTIONS, INSIGHTS, PLAN AHEAD) feel like a long vertical scroll of similarly-styled white cards with minimal visual hierarchy differentiation.

## Proposed Improvements

### 1. Reduce Visual Clutter - Consolidate Sections

**Problem:** There are too many small section headers (YOUR DAY, QUICK ACTIONS, INSIGHTS, PLAN AHEAD) making the page feel like a long checklist rather than a dashboard.

**Solution:**
- Merge "Today's Stats" and "Weekly Progress" into a single **compact stats bar** with two columns side by side instead of stacked full-width cards.
- Remove the redundant section label text ("YOUR DAY", "INSIGHTS", etc.) and let the cards speak for themselves with better spacing.
- The hero card already shows weekly progress — remove the duplicate "Weekly Progress" card lower on the page.

### 2. Quick Action Tiles - Grid Refinement

**Problem:** The first tile is full-width and the rest are in a 2-column grid, creating an inconsistent visual rhythm.

**Solution:**
- Make ALL tiles a uniform 3-column grid (matching the style of the old `HomeQuickActions` component) — smaller, icon-focused tiles without subtitles.
- This reduces the vertical space consumed by tiles by roughly 50% and puts more content above the fold.
- Remove the chevron arrows and subtitle text from tiles; keep just icon + label.

### 3. Next Lesson Card - Tighten Spacing

**Problem:** The Next Lesson card is well-designed but takes significant vertical space.

**Solution:**
- Reduce internal padding from `p-4` to `p-3`.
- Make the "More actions" expandable section default-collapsed (already is) but reduce the collapsed card height by tightening the action button row spacing.

### 4. Hero Card - Streamline

**Problem:** The hero overlapping card shows greeting, weekly goal subtitle, badges, a progress ring, AND a progress bar — some redundancy.

**Solution:**
- Remove the **linear progress bar** since the circular ring already shows the same data.
- This saves ~24px of vertical space and reduces visual noise.
- Keep the ring + greeting + badges as they are.

### 5. Background and Spacing Polish

**Problem:** The light blue background (#E8F1FE) is nice but cards don't have enough breathing room.

**Solution:**
- Increase gap between major sections from `mt-4` to `mt-5`.
- Add a subtle bottom padding to the last section so content doesn't butt up against the bottom nav.
- Ensure consistent card shadow depth across all cards.

### 6. Today's Route Map - Make Optional

**Problem:** The route map preview takes significant space and may not always have data.

**Solution:**
- Only render the TodayRoutePreview when there are 2+ lessons (already partially done but ensure it collapses cleanly).
- When shown, cap its height at 120px instead of letting it grow.

---

## Technical Details

### Files to Modify

1. **`src/components/instructor/InstructorMobileHome.tsx`**
   - Remove duplicate section labels or consolidate them
   - Merge "Today's Stats" and "Weekly Progress" into a single row
   - Adjust spacing classes (mt-4 to mt-5, add pb-24 at bottom)

2. **`src/components/instructor/ContextualHomeHero.tsx`**
   - Remove the linear progress bar (lines 254-267)
   - Tighten card padding slightly

3. **`src/components/instructor/QuickActionTiles.tsx`**
   - Convert normal view from "1 full-width + 2-col grid" to a uniform 3-column grid
   - Simplify tile rendering to icon + label only (no subtitles, no chevrons)
   - Reduce tile padding for compact appearance

4. **`src/components/instructor/NextUpTile.tsx`**
   - Reduce internal padding and action row spacing

### No Database Changes Required

All changes are purely presentational — CSS classes, layout structure, and component rendering logic.

