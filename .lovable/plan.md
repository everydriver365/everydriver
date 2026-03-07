

## Problem

The "Month End" tile exists in the `SwipeableQuickAccess` component but is missing from the two main tile systems used by the mobile app:
- `AppStyleHomeView.tsx` (the iOS-style home grid)
- `DashboardLayoutManager.tsx` (the tile visibility settings)

## Plan

**Add "Month End" to the `additionalTiles` array in both files:**

1. **`src/components/instructor/AppStyleHomeView.tsx`** — Add a month-end entry to `additionalTiles` and import the existing `month-end-icon.png` asset. Add it to the `customIconImages` map.

2. **`src/components/instructor/DashboardLayoutManager.tsx`** — Same changes: add the tile to `additionalTiles`, import the icon, and add it to `customIconImages`.

The tile will use:
- `id: "month-end"`
- `title: "Month End"`
- `icon: "FileBarChart"` (fallback)
- `route: "/instructor/month-end"`
- Custom PNG: `src/assets/month-end-icon.png` (already exists)

Both files also need `FileBarChart` added to the lucide icon imports for the fallback, and added to the `iconMap`.

