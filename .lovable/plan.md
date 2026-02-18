
# OSRM Road-Snapped Interpolation for Live Map Markers

## What Changes
Instead of moving markers in a straight line between GPS updates (which cuts corners on curves), the system will fetch the actual road geometry from OSRM when each new GPS fix arrives, then animate the marker along that road path over the 10-second interval.

## How It Works

1. **When a new GPS position arrives** (every ~10 seconds), call the OSRM `route` API with the previous position and the new position
2. OSRM returns the **actual road geometry** (a list of lat/lng points along the road) between those two locations
3. The animation loop walks the marker along those road points over time, instead of extrapolating in a straight line

This means on curves, roundabouts, and bends, the marker follows the road shape.

## Changes

### 1. Rewrite `src/hooks/useInterpolatedPosition.ts`

- When a new real position arrives and differs from the previous one, fire an OSRM `route` request: `https://router.project-osrm.org/route/v1/driving/{prevLng},{prevLat};{newLng},{newLat}?overview=full&geometries=geojson`
- Store the returned road geometry as an array of waypoints
- Calculate the total path length in km
- The animation loop (200ms interval) computes how far along the path the marker should be based on elapsed time and speed, then finds the correct waypoint position
- Falls back to the old bearing-based extrapolation if the OSRM call fails or if there's no previous position

### 2. Update `src/components/instructor/FleetLiveMap.tsx` interpolation loop

- Same approach for the fleet map's per-device interpolation: store a road geometry per device
- When a device update arrives via realtime, fetch the OSRM route from old position to new position
- Walk markers along the road geometry in the 200ms animation interval
- Fallback to bearing-based movement if OSRM fails

### 3. Update `src/components/instructor/tracking/MiniLiveMap.tsx`

- No code changes needed here -- it already consumes `useInterpolatedPosition`, so it gets road-snapping automatically

## Rate Limiting Consideration

OSRM's public demo server (`router.project-osrm.org`) is free but has usage limits. With one vehicle updating every 10 seconds, that's only ~6 OSRM calls per minute -- well within acceptable usage. For multiple fleet vehicles, the calls scale linearly but remain modest.

## Fallback Behavior

If an OSRM request fails (network issue, rate limit), the hook falls back to the existing straight-line bearing interpolation. The user sees slightly less accurate movement on curves but never a frozen marker.

## Technical Details

**OSRM Route Response Structure:**
```text
{
  "routes": [{
    "geometry": {
      "coordinates": [[lng, lat], [lng, lat], ...],
      "type": "LineString"
    }
  }]
}
```

**Path walking algorithm:**
- Pre-compute cumulative distances along the OSRM geometry
- Each animation tick: `progressKm = (speedKmh / 3600) * elapsedSeconds`
- Binary search the cumulative distance array to find which segment the marker is on
- Linearly interpolate within that segment for sub-segment smoothness
