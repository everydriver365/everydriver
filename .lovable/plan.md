
# Fix: Live Map Not Displaying on Fleet Dashboard

## Problem
The Radix UI Tabs component completely **unmounts** inactive tab content. When you click "Live Map", the component mounts and Leaflet tries to initialize, but there's a race condition -- the `IntersectionObserver` may not fire reliably because the container transitions from unmounted to visible too quickly, and the map ends up with zero-size tiles.

## Solution
Two changes to guarantee the map always renders:

### 1. Force-mount the Live Map tab (InstructorFleetDashboard.tsx)
Add `forceMount` to the Live Map `TabsContent` so the component stays in the DOM (but hidden when inactive). This lets the `IntersectionObserver` properly detect when the tab becomes visible.

```
<TabsContent value="livemap" className="mt-4" forceMount style when inactive>
```

The tab content will use `hidden` styling when not the active tab, keeping it in the DOM but invisible.

### 2. Strengthen map initialization (FleetLiveMap.tsx)
- Add a small delay (50ms) before the first `IntersectionObserver` callback initializes the map, ensuring the container has non-zero dimensions
- Add a `requestAnimationFrame` wrapper around `invalidateSize` calls for more reliable rendering
- These are defensive measures that work alongside the `forceMount` fix

## Why This Works
- `forceMount` keeps the map container in the DOM at all times
- The `IntersectionObserver` (already in place) detects when the tab becomes visible and initializes/invalidates the map
- This is the same pattern used by other map components in the app that live inside tabs

## Files Changed
- **`src/pages/InstructorFleetDashboard.tsx`** -- Add `forceMount` and conditional visibility to the livemap `TabsContent`
- **`src/components/instructor/FleetLiveMap.tsx`** -- Add a short delay before init to guarantee container has layout dimensions
