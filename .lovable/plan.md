

# Remove Blue Gradient Line from Tiles

## What changes
Remove the `height: 2px` blue gradient bar (`linear-gradient(to right, #0d4fa0, #56a8f5)`) from the bottom of all tile cards. This appears in two components:

### Files to edit
1. **`src/components/instructor/ActivityTilesGrid.tsx`** — Remove the gradient `div` inside each tile's bottom row (the `height: 2, flex: 1, background: linear-gradient(...)` element). Keep the emoji aligned bottom-right.

2. **`src/components/instructor/InsightTilesGrid.tsx`** — Same removal of the identical gradient bar div.

No other styling, layout, shadows, badges, or functionality changes.

