

# Fix: Blue Track Line Lagging Behind Car Marker

## Problem

The car marker updates instantly via Realtime subscription, but the blue track line only updates every **5 seconds** because each update cycle:

1. Queries the database for new GPS points
2. Calls the `snap-to-road` edge function (Google Roads API round-trip)
3. Only then re-renders the polyline

This creates a visible gap where the marker has moved ahead but the track line hasn't caught up.

## Solution

**Immediately extend the polyline with raw GPS coordinates** whenever the device position updates via Realtime, then periodically snap the full route to roads in the background. This gives the user instant visual feedback while still getting clean road-snapped lines.

### Changes to `src/components/instructor/GoogleLiveTrackingMap.tsx`

1. **Instant polyline extension on marker update (Effect #3)**
   - When the device position changes (via Realtime), immediately append the new lat/lng to the polyline path
   - This makes the blue line follow the marker with zero delay
   - Use a simple distance filter (>3m) to avoid jitter

2. **Reduce snap-to-road tick to background cleanup only**
   - Keep the 5-second snap-to-road cycle but treat it as a "polish" step that replaces the raw tail with snapped coordinates
   - The polyline is already visually up-to-date from step 1, so the snap just smooths it onto roads

### Technical Detail

In Effect #3 (marker update, ~line 227), after updating the marker position, append the new position to the Google Maps Polyline path directly:

```text
// Pseudocode for the change:
- When device lat/lng changes via Realtime
- Calculate distance from last polyline point
- If > 3m, append new LatLng to polyline.getPath()
- This happens instantly, no network call needed
```

In Effect #5 (the 5-second tick, ~line 278), the snap-to-road cycle continues as before but now it's just smoothing an already-current polyline rather than being the only source of updates.

### Why This Works

- The marker and polyline now update from the **same trigger** (Realtime device update)
- No additional API calls -- the raw point extension is purely client-side
- Road-snapping still runs in the background to keep the line looking clean on roads
- Net result: the blue line stays within 1 GPS update of the marker at all times

