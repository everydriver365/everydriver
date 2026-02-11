

# Enhance Live Tracking Map with Car Icon and Smooth Rotation

## Overview
Replace the current arrow/navigation marker with a proper car icon that rotates based on heading, inspired by the shared HTML example. The current implementation rotates an SVG arrow inside a div -- this plan upgrades it to a cleaner car icon with smoother visual rotation.

## Changes

### File: `src/components/instructor/LiveTrackingMap.tsx`

**1. Replace the arrow SVG with a car SVG icon**
- Swap the navigation arrow (`path d="M12 2L4.5 20.29..."`) with a top-down car SVG (similar to the one used in `FleetLiveMap.tsx`)
- Keep the existing CSS rotation approach (`transform: rotate(${rotation}deg)`) which works well without needing a third-party plugin

**2. Improve the marker styling**
- Use a colored circular background (blue for connected, grey for disconnected) matching the fleet map style
- Add a subtle directional indicator (heading line or pointer) so rotation is clearly visible even at a glance
- Increase contrast with a white car icon on the colored background

**3. Add smooth rotation transition**
- Add `transition: transform 0.5s ease` to the rotating inner element so heading changes animate smoothly rather than snapping instantly

## Technical Details

The `leaflet-rotate` plugin from the example is not needed -- it rotates the entire map canvas, which is a different use case. The existing approach of rotating the icon SVG via CSS `transform: rotate()` is correct and lighter weight. The improvement is purely visual (better icon + smooth CSS transition).

### Updated marker HTML (lines 310-339):
```html
<div style="position:relative;width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
  <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:#3b82f6;box-shadow:0 3px 12px rgba(0,0,0,0.25);"></div>
  <div style="position:relative;width:24px;height:24px;transform:rotate(${rotation}deg);transition:transform 0.5s ease;z-index:1;">
    <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
    </svg>
  </div>
</div>
```

- Blue circle background when connected, grey when disconnected
- White car SVG rotates smoothly with heading
- Consistent with FleetLiveMap marker style

