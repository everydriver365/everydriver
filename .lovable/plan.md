

# Fix: Live Map Blank on Fleet Dashboard

## Problem

The `IntersectionObserver`-based map initialization is unreliable. When the Live Map tab uses `forceMount` + `data-[state=inactive]:hidden`, the observer doesn't consistently detect the visibility change from `display: none` to visible. This means `initMap()` is never called, leaving the map container as a blank gray box.

## Solution

Replace the `IntersectionObserver` approach with **explicit React state tracking** of the active tab. The parent page tracks which tab is selected and passes an `isVisible` prop to `FleetLiveMap`. When the prop becomes `true`, the map initializes (or invalidates its size if already initialized).

This is deterministic -- no reliance on browser intersection behavior.

## Changes

### 1. InstructorFleetDashboard.tsx

- Add `useState` to track the active tab value
- Wire `onValueChange` to the `Tabs` component
- Pass `isVisible={activeTab === "livemap"}` to `FleetLiveMap`

### 2. FleetLiveMap.tsx

- Add `isVisible` prop to the interface
- Remove the `IntersectionObserver` logic entirely
- Add a new `useEffect` that watches `isVisible`:
  - When `true` and no map exists: create the map after a `requestAnimationFrame` (ensures container has layout dimensions)
  - When `true` and map exists: call `invalidateSize()` to fix any stale tile rendering
- Keep the `ResizeObserver` for handling window/container resizes
- Keep the map cleanup on unmount

## Technical Detail

```text
BEFORE (unreliable):
  forceMount -> display:none -> IntersectionObserver -> (may not fire) -> initMap()

AFTER (deterministic):
  forceMount -> display:none -> React state: isVisible=false
  User clicks tab -> React state: isVisible=true -> useEffect -> initMap()
```

The key change is moving from a browser API (IntersectionObserver) that has edge cases with `display: none` parents, to React-controlled state that fires reliably on every tab switch.

## Files Changed

- **`src/pages/InstructorFleetDashboard.tsx`** -- Track active tab state, pass `isVisible` prop
- **`src/components/instructor/FleetLiveMap.tsx`** -- Replace IntersectionObserver with `isVisible`-driven initialization
