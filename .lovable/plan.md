

## Fix: Blue Polyline Not Keeping Up With Vehicle Marker

The polyline trail lags behind the vehicle arrow because of two issues in `MiniLiveMap.tsx`:

### Problem 1 — Overly aggressive deduplication
The threshold `0.00005` degrees (~5.5m) filters out legitimate movement points at low speeds or short poll intervals, causing the line to stall while the marker moves ahead.

### Problem 2 — Path not connected after historical trail load
When historical GPS points are loaded from the session, the last historical point may be far from the current live position. New points append to `pathRef` but the gap between the last historical point and the first live update creates a visual disconnect.

### Changes — Single file: `src/components/instructor/tracking/MiniLiveMap.tsx`

1. **Lower the dedup threshold** from `0.00005` to `0.000005` (~0.5m) — effectively always append unless truly stationary
2. **After loading historical trail, bridge the gap** — append the current live position to the end of the loaded trail so the polyline connects to the marker immediately
3. **Always append the current position on every update** when the marker moves, ensuring the blue line reaches the arrow at all times

### Technical detail

```
// Before (line 159-161):
Math.abs(lastPt.lat() - latitude) > 0.00005 ||
Math.abs(lastPt.lng() - longitude) > 0.00005;

// After — reduced threshold so line keeps up:
Math.abs(lastPt.lat() - latitude) > 0.000005 ||
Math.abs(lastPt.lng() - longitude) > 0.000005;
```

After the historical trail loads (line 126), bridge to current live position:
```typescript
// Bridge trail to current live position
if (latitude != null && longitude != null) {
  const livePt = new google.maps.LatLng(latitude, longitude);
  pathRef.current.push(livePt);
  polylineRef.current?.setPath(pathRef.current);
}
```

