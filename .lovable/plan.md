

## Problem

The green **+** button in the mobile header opens `QuickActionsPopoverMenu`, which displays a **vertical list** of actions with small colored circles. The user expects it to match the style shown in the reference image: an **iOS-style grid of square tiles** with custom image icons (like the tiles already used in `QuickActionTiles.tsx`).

## Root Cause

`QuickActionsPopoverMenu.tsx` uses a simple vertical list layout with `lucide-react` icons in colored circles. Meanwhile, the dashboard's `QuickActionTiles.tsx` already has the correct iOS-style appearance with custom image assets (`messages-icon.png`, `take-payment-icon.png`, etc.) rendered in a grid.

## Plan

**Restyle `QuickActionsPopoverMenu.tsx`** to use the same iOS-style grid layout and custom image icons as `QuickActionTiles.tsx`:

1. **Update the layout** from a vertical list to a **4-column grid** of square tiles
2. **Import the same custom image assets** already used in `QuickActionTiles.tsx` (e.g., `scheduleIcon`, `pupilsIcon`, `trackIcon`, etc.)
3. **Map each quick action to its custom icon image** where available, falling back to lucide icons with colored circles for actions that don't have custom images
4. **Style each tile** as a rounded square with the icon image centered and a label below — matching the reference screenshot
5. **Add a `ScrollArea`** so the grid is scrollable if it overflows the viewport, keeping the close button accessible

This ensures the popover from the header + button has the same visual identity as the dashboard tiles.

