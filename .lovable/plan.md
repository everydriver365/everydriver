

## Plan: Change Activity Tiles to 2×2 Grid with Larger Text

### What changes
**File: `src/components/instructor/ActivityTilesGrid.tsx`**

1. Change grid from `grid-cols-4` to `grid-cols-2`
2. Increase tile height/padding for the larger grid cells
3. Increase icon size from 32×32 to 40×40 (using existing SVGs which are already 40×40 viewBox)
4. Increase label text from `9.5px` to `13px`
5. Increase badge size proportionally
6. Adjust internal spacing for the larger tiles

### Technical details
- The SVG icons are already defined at 40×40 viewBox, so they scale naturally
- The container div constraining icons to 32×32 will be updated to 40×40
- Badge positioning stays top-right but with slightly larger font
- No changes to routing, data, or other components

