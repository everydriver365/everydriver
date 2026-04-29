# Match "On track today" to "Today · your stats"

The "Today · your stats" tile lower on the page is `WeekAtAGlanceCard` (`src/components/instructor/WeekAtAGlanceCard.tsx`), rendered by `WarmHomeTiles`. It already has everything you'd want: animated lessons / earnings / hours rings, today / week / month segmented control with swipe, expand-collapse, editable goals sheet, and tap targets that route to the right pages.

The "On track today" tile in `CalmHomeHeader` is a separate, simpler component (`ProgressRingsCompact`) wired to a different data source and just navigates to `/instructor/earnings` on tap. Layout, behaviour and data don't match.

The clean way to make them identical is to drop the bespoke component and reuse `WeekAtAGlanceCard` in the calm header.

## Changes

**`src/components/instructor/CalmHomeHeader.tsx`**
- Replace the `<ProgressRingsCompact …/>` block with `<WeekAtAGlanceCard instructorId={instructorId} />`.
- Remove the now-unused helpers and hooks: `ProgressRingsCompact`, `ConcentricRings`, `LegendRow`, plus `useWeeklyGoals`, `useInstructorLiveStats`, `hoursTaught` / `earnedToday` calculations.
- Keep `useTodayRemainingLessons` / `useTodayOverview` only for the greeting status line.

After this, the rings tile in the hero is the exact same component, layout and behaviour as the "Today · your stats" tile below.

## Heads-up: duplication

Once the swap is in, the same `WeekAtAGlanceCard` will appear twice on the home page — once in the calm hero and once again inside `WarmHomeTiles` lower down. Two options, please pick one when you approve:

1. **Keep both** (literal "exactly the same … as the tile below"). Simplest, but visually repetitive.
2. **Replace in hero, remove from `WarmHomeTiles`** so it only shows in the new hero position. Recommended.

Default if you just approve: **option 2** (remove the duplicate render in `WarmHomeTiles.tsx` line 382 so the tile only appears in the hero).
