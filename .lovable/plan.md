

# Make Instructor Mobile Home Page Full Width

## Overview
Remove the horizontal padding (`px-4`, `mx-4`) from the instructor mobile home page so that content stretches edge-to-edge, giving a more immersive, app-like feel on mobile devices.

## Current State
The page content is already inside a full-width container (no `max-width` or `container` class constraining it), but individual sections use `px-4` or `mx-4` Tailwind classes that add 16px padding on each side. This affects:
- The `ContextualHomeHero` wrapper (`px-4 pt-4`)
- Section labels (`px-4`)
- `NextUpTile` (internal `mx-4`)
- `TodayMiniTimeline`, `TodayRoutePreview`, `GapFillerCard` (internal margins)
- Quick Action Tiles wrapper (`px-4`)
- Stats/Insights cards (`px-4`)
- Tomorrow Peek, Road Alerts, etc.

## Plan

### 1. Remove padding from hero wrapper
In `InstructorMobileHome.tsx`, change the hero wrapper from `px-4 pt-4` to `pt-4` (or remove padding entirely for a true edge-to-edge hero image).

### 2. Update section-level padding
Remove or reduce `px-4` from section label paragraphs, Quick Actions wrapper, and Insights card wrappers so tiles can go full-width.

### 3. Update child components
Adjust internal `mx-4` / `px-4` in components like `NextUpTile`, `TodayMiniTimeline`, `TodayRoutePreview`, `GapFillerCard`, `FuelFinderCard`, `TomorrowPeekCard`, `RoadAlertsRow`, and `DrivingAlertsStrip` to remove side margins.

### 4. Preserve card aesthetics
Cards themselves will keep their internal padding (the `p-3`/`p-4` inside each card) so text doesn't touch the edge. Only the outer page-level margins are removed, so cards span the full screen width with their borders/shadows touching the edges -- similar to native iOS/Android app layouts.

## Technical Details

Files to modify:
- `src/components/instructor/InstructorMobileHome.tsx` -- Remove `px-4` from wrappers
- `src/components/instructor/ContextualHomeHero.tsx` -- Remove `mx-4` if present on the overlapping card
- `src/components/instructor/NextUpTile.tsx` -- Remove `mx-4`
- `src/components/instructor/TodayMiniTimeline.tsx` -- Remove side margins
- `src/components/instructor/TodayRoutePreview.tsx` -- Remove side margins
- `src/components/instructor/GapFillerCard.tsx` -- Remove side margins
- `src/components/instructor/FuelFinderCard.tsx` -- Remove side margins
- `src/components/instructor/TomorrowPeekCard.tsx` -- Remove side margins
- `src/components/instructor/RoadAlertsRow.tsx` -- Remove side margins
- `src/components/instructor/DrivingAlertsStrip.tsx` -- Remove side margins
- `src/components/instructor/QuickActionTiles.tsx` -- Verify no constraining margins

Each component will have its outer `mx-4`/`px-4` removed so they fill the full viewport width while keeping internal card padding intact.

