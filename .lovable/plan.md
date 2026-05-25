## Problem

`GoogleLiveTrackingMap.tsx` (the live tracking map currently in use at `/instructor/tracking`) renders the vehicle position as a Google Maps `SymbolPath.FORWARD_CLOSED_ARROW` — a plain triangular arrow, not a car. The Leaflet variant (`LiveTrackingMap.tsx`) already has a proper car SVG inside a coloured ring, but the Google version was never updated.

## Fix

Swap the marker icon in `src/components/instructor/GoogleLiveTrackingMap.tsx` for a car-shaped SVG path that:

- Uses Google Maps `Symbol` with a custom `path` (top-view car silhouette pointing "up" so the existing `rotation: device?.last_heading ?? 0` continues to orient it correctly).
- Keeps the existing `fillColor: markerColor` (status colour: connected / parked / reconnecting / offline) and white stroke for legibility.
- Replaces the current `scale: 6` arrow with an appropriately scaled car (~`scale: 1.4`) anchored at its centre.

### Edit

In `GoogleLiveTrackingMap.tsx`, replace the `marker.setIcon({...})` block (around lines 315-323) with:

```ts
marker.setIcon({
  // Top-view car silhouette, pointing up (north). Heading rotates it.
  path: "M -6 -10 C -6 -12 -4 -13 0 -13 C 4 -13 6 -12 6 -10 L 6 -2 L 7 -1 L 7 8 C 7 11 5 12 0 12 C -5 12 -7 11 -7 8 L -7 -1 L -6 -2 Z",
  scale: 1.4,
  rotation: device?.last_heading ?? 0,
  fillOpacity: 1,
  fillColor: markerColor,
  strokeColor: "white",
  strokeWeight: 2,
  anchor: new w.google.maps.Point(0, 0),
});
```

And the same swap inside the initial `new w.google.maps.Marker({...})` (lines ~180-184), passing an `icon` so the very first paint already shows the car rather than the default red pin:

```ts
markerRef.current = new w.google.maps.Marker({
  position: center,
  map,
  title: "Live position",
  icon: {
    path: "M -6 -10 C -6 -12 -4 -13 0 -13 C 4 -13 6 -12 6 -10 L 6 -2 L 7 -1 L 7 8 C 7 11 5 12 0 12 C -5 12 -7 11 -7 8 L -7 -1 L -6 -2 Z",
    scale: 1.4,
    rotation: 0,
    fillOpacity: 1,
    fillColor: "#22c55e",
    strokeColor: "white",
    strokeWeight: 2,
    anchor: new w.google.maps.Point(0, 0),
  },
});
```

To avoid duplicating the path string, lift it to a `const CAR_SVG_PATH = "..."` at the top of the file.

## Out of scope

- No change to the speed badge overlay, polyline tail, auto-zoom, or status-colour logic.
- No change to the Leaflet `LiveTrackingMap.tsx` (already has a car).
- No new image assets — using an inline SVG path so rotation by heading keeps working natively.

## Files touched

- `src/components/instructor/GoogleLiveTrackingMap.tsx`
