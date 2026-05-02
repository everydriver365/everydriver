# Stop the blue pointer bouncing & clean up the trail line

## What's happening today

In `SatNavLiveMap.tsx`, every GPS fix is treated as truth:

- The "should add to trail" threshold is ~0.5 m, well below normal GPS jitter (3–10 m) — so noisy fixes zig-zag the blue line.
- When the car is stationary, GPS heading drifts randomly, and we feed it straight into the map's heading, so the marker visually spins in place.
- A single bad fix (e.g. a 100 m jump) is drawn as a straight spike across the map.
- The Snap-to-Roads call is fed all of that jitter, so even the "snapped" line inherits the noise.

## Fix

Add three guards inside the GPS-fix effect, and adjust the trail/snap behaviour accordingly. All thresholds match the existing project rule of "3 m jitter filtering" used elsewhere in the GPS pipeline.

### 1. Stationary gate (kills bouncing while parked)

- Treat speed `< 3 km/h` (~walking) as "not moving".
- While not moving:
  - Don't update the map's `heading` from the GPS heading — hold the previous value.
  - Don't append new points to the trail polyline.
  - Don't trigger a Snap-to-Roads request.
- Marker still moves to the new lat/lng so it stays accurate, but it no longer twitches because we re-anchor `from` and `target` to the same point.

### 2. Jitter gate (clean trail line)

- Compute distance from the previous accepted fix in metres (haversine).
- Only append to `pathRef.current` when `distance >= 3 m`.
- Replaces the current `0.000005°` lat/lng tolerance.

### 3. Outlier gate (no map-spanning spikes)

- If a new fix is `> 200 m` from the previous one **and** the gap since the last fix is `< 15 s`, reject it as a teleport (return early without updating any state).
- Real signal-loss recoveries (>15 s gap) are still accepted so we don't get stuck.

### 4. Snap-to-Roads only on clean input

Because Snap-to-Roads is now only called when a point passes the jitter + stationary + outlier gates, the snapped line will be much closer to the real road geometry without further changes.

## Files

- `src/components/instructor/tracking/SatNavLiveMap.tsx` — update the GPS-fix `useEffect` (currently lines ~321–364) to add the three guards above, and add `speedKmh` to its dependency list.

## Out of scope

- No changes to the marker icon, snap edge function, polling cadence, or DB schema.
- No changes to the historical trail loader (it already uses recorded points, not live jitter).
- No mobile layout changes outside this component.
