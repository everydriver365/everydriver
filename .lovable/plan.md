

# Make Hero & Activity Tiles Match Quick Access Elevation

## What's changing
The "Good evening" hero card and the 4 activity tiles (Job Offers, Messages, Tests, Fill Gaps) currently have a flat, subtle shadow (`0 1px 3px rgba(0,0,0,0.08)` + border). The Quick Access tiles use a more elevated, prominent shadow that makes them "pop". We'll apply that same shadow style to the hero and activity tiles.

## Changes

### 1. `src/components/instructor/HomepageHero.tsx`
- Update the hero card's `boxShadow` from `"0 1px 3px rgba(0,0,0,0.08)"` to the Quick Access style: `"inset 0px 1px 0px rgba(255,255,255,0.6), 0px 8px 20px rgba(0,0,0,0.08), 0px 2px 6px rgba(0,0,0,0.04)"`
- Remove the `border: "0.5px solid #E5E5EA"` to match the borderless Quick Access look

### 2. `src/components/instructor/ActivityTilesGrid.tsx`
- Update each activity tile's `boxShadow` from `"0 1px 3px rgba(0,0,0,0.08)"` to the same elevated shadow
- Remove the `border: "0.5px solid #E5E5EA"` from each tile

Both components will then visually match the SwipeableQuickAccess tiles' elevated card style.

