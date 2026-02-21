

# Move Job Offers Counter Badge Over the Icon

## What changes
Move the notification counter badge from its current position (right side of the tile row) to overlay on top of the tile icon, like iOS app notification badges.

## Technical details

**File: `src/components/instructor/QuickActionTiles.tsx`**

In the normal view mode (around lines 456-485), restructure the badge positioning:

1. Make the icon container `relative` so the badge can be absolutely positioned over it
2. Move the badge `<span>` from after the title section (lines 481-485) to inside the icon `<div>` (after line 472)
3. Position the badge at `absolute -top-1 -right-1` so it overlaps the top-right corner of the icon

This applies the same pattern already used in the edit mode (lines 383-387) and in `AppStyleHomeView.tsx`.

