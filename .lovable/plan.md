
# Fix: Live Tracking Map Not Moving

## Problem Identified

The live tracking map marker does not move during an active session because of a data flow mismatch:

| Data Source | Used For | Update Frequency |
|-------------|----------|------------------|
| `device.last_latitude/longitude` (props) | **Marker position** | ~15s (polling `gps_devices`) |
| `telematics_gps_points` (realtime) | **Polyline only** | Real-time (~1-5s) |

The marker is controlled by props from the parent component, which polls the `gps_devices` table every 15 seconds. Meanwhile, the realtime subscription to `telematics_gps_points` in `LiveTrackingMap` only adds points to the polyline - it never updates the marker position!

## Root Cause in Code

In `LiveTrackingMap.tsx`:

**Realtime subscription (lines 214-263)** - Only updates polyline:
```typescript
.on("postgres_changes", { event: "INSERT", table: "telematics_gps_points" }, (payload) => {
  const point = { lat: row.latitude, lng: row.longitude, ... };
  if (isValid) {
    setFilteredPoints((prev) => [...prev, point]);  // ← Only updates polyline
    // Marker position NOT updated here!
  }
})
```

**Marker update (lines 265-328)** - Only reacts to prop changes:
```typescript
useEffect(() => {
  markerRef.current.setLatLng([latitude, longitude]);  // ← Only from props
}, [latitude, longitude, heading, userDragged]);  // ← latitude/longitude are props
```

## Solution

Update the marker position from the realtime GPS subscription, not just the props. We'll add a local state for the "live" position that overrides props when realtime data arrives.

### Changes to LiveTrackingMap.tsx

1. **Add local state for live position** that can be updated from realtime data
2. **Update the realtime subscription handler** to set the live position when new points arrive
3. **Modify marker effect** to use live position when available, falling back to props

### Implementation

**Step 1: Add local state for live position**
```typescript
// New state for realtime position (overrides props when available)
const [livePosition, setLivePosition] = useState<{lat: number; lng: number; heading?: number} | null>(null);
```

**Step 2: Update realtime subscription to update live position**
```typescript
// In the realtime subscription handler
if (isValid) {
  setFilteredPoints((prev) => [...prev, point]);
  lastValidPointRef.current = point;
  setDisplaySpeed(processSpeed(point.speedKmh));
  
  // NEW: Update live position for marker
  setLivePosition({ lat: point.lat, lng: point.lng });
}
```

**Step 3: Use live position for marker**
```typescript
// Compute actual marker position
const markerLat = livePosition?.lat ?? latitude;
const markerLng = livePosition?.lng ?? longitude;

useEffect(() => {
  // Use markerLat/markerLng instead of latitude/longitude directly
  if (markerLat === null || markerLng === null) { ... }
  markerRef.current.setLatLng([markerLat, markerLng]);
}, [markerLat, markerLng, heading, userDragged]);
```

**Step 4: Reset live position when session ends**
```typescript
// In the session ID effect
useEffect(() => {
  if (!sessionId) {
    setFilteredPoints([]);
    lastValidPointRef.current = null;
    setLivePosition(null);  // Reset on session end
    // ...
  }
}, [sessionId]);
```

### Data Flow After Fix

```text
Pre-session:
  gps_devices (polling) → props → marker position ✓

During session:
  telematics_gps_points (realtime) → livePosition state → marker position ✓
                                   → filteredPoints → polyline ✓
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/instructor/LiveTrackingMap.tsx` | Add `livePosition` state, update realtime handler, modify marker effect |

## Benefits

1. **Smooth real-time movement**: Marker updates instantly as GPS points arrive (~1-5s)
2. **Backwards compatible**: Falls back to props when no realtime data (pre-session)
3. **Minimal changes**: Only modifies the internal state management, no API changes

## Technical Notes

- The `telematics_gps_points` table already has realtime enabled
- The subscription filter uses `telematics_id=eq.${sessionId}` which is correct
- Heading data may not be in `telematics_gps_points` - we'll use the prop heading as fallback
