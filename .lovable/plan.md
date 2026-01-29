
# Full-Screen Live Vehicle Tracking Map

## Overview
This plan creates a single, robust `TraccarLiveMap` component that reliably tracks a vehicle in real-time using GPS data from Supabase, with intelligent filtering to prevent false movement and speed readings when stationary.

## Problem Analysis
The current implementation shows false movement and speeds because:
1. GPS jitter when stationary causes the marker to "jump around"
2. Raw GPS speed values are displayed without validation
3. Low accuracy readings (indoor/urban canyons) are accepted
4. No distance-based movement validation

## Solution Architecture

```text
+----------------------+     +------------------+     +-------------------+
|  Supabase Realtime   | --> |  GPS Point       | --> |  Filtered Points  |
|  telematics_gps_points|     |  Validator       |     |  (route + marker) |
+----------------------+     +------------------+     +-------------------+
                                     |
                             +--------------+
                             |  Haversine   |
                             |  Distance    |
                             |  Check       |
                             +--------------+
```

## Filtering Logic (Key to Solving the Problem)

**When a new GPS point arrives, apply these checks in order:**

1. **Accuracy Filter**: Reject if `accuracy_m > 25` (poor GPS signal)
2. **Distance Filter**: Calculate Haversine distance from last accepted point
   - If distance < 10 meters → Ignore point (GPS jitter)
   - If distance > 10 meters → Accept point as real movement
3. **Speed Cap**: If `speed_kmh > 160` → Set to 0 (unrealistic)
4. **Speed Zeroing**: If point was rejected by distance filter → Display speed as 0

## Technical Implementation

### Component: `TraccarLiveMap.tsx`

**Props:**
- `telematicsId: string` - The session ID to track
- `className?: string` - Optional styling

**State:**
- `filteredPoints: GPSPoint[]` - Only validated movement points
- `lastValidPoint: GPSPoint | null` - Last accepted position
- `displaySpeed: number` - Filtered speed in mph
- `userDragged: boolean` - Disable auto-center when user interacts

**Core Functions:**

```typescript
// Haversine formula for accurate distance calculation
function haversineDistance(lat1, lon1, lat2, lon2): number {
  const R = 6371000; // Earth's radius in meters
  // ... calculate and return distance in meters
}

// Validate incoming GPS point
function validatePoint(point, lastPoint): { 
  isValid: boolean; 
  distance: number;
} {
  // 1. Check accuracy
  if (point.accuracy_m > 25) return { isValid: false, distance: 0 };
  
  // 2. Check distance from last point
  if (!lastPoint) return { isValid: true, distance: 0 };
  
  const distance = haversineDistance(
    lastPoint.lat, lastPoint.lng, 
    point.lat, point.lng
  );
  
  return { isValid: distance >= 10, distance };
}
```

**Data Flow:**

1. **On Mount**: Load historical points from `telematics_gps_points`, applying filters
2. **Realtime**: Subscribe to `INSERT` events on the table
3. **On New Point**: 
   - Run through validator
   - If valid: Add to route, update marker, auto-center (if not dragged)
   - If invalid: Keep marker at last position, set speed to 0

### UI Components

**Speed Display (bottom overlay):**
- Large speed number in mph
- Turns red if speeding (when speed limit available)
- Shows "0" when stationary/filtered

**Map Interactions:**
- Dragging disables auto-center
- Button to re-enable auto-center ("Center on Vehicle")

**Loading/Error States:**
- Spinner when waiting for first valid GPS point
- "Waiting for GPS..." message

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/instructor/TraccarLiveMap.tsx` | Replace | Complete rewrite with filtering logic |
| `src/pages/InstructorTraccarSession.tsx` | Update | Pass `telematicsId` prop correctly |

## Implementation Checklist

1. **Haversine Distance Function**
   - Implement accurate Earth-distance calculation
   - Return distance in meters

2. **GPS Point Validator**
   - Check accuracy threshold (25m)
   - Check movement threshold (10m)
   - Cap unrealistic speeds (160 km/h)

3. **Route History Loader**
   - Fetch from `telematics_gps_points`
   - Apply same filters to historical data
   - Build initial polyline

4. **Realtime Subscription**
   - Listen for INSERT events
   - Filter through validator
   - Update UI only for valid points

5. **Map Interactions**
   - Track user drag state
   - "Center on Vehicle" button
   - Smooth marker animation

6. **Speed Display**
   - Convert km/h to mph
   - Apply speed zeroing for filtered points
   - Speeding indicator

## Expected Behavior After Implementation

| Scenario | Current Behavior | New Behavior |
|----------|-----------------|--------------|
| Stationary with GPS jitter | Marker jumps, shows 2-5 mph | Marker stays still, shows 0 mph |
| Moving at 30 mph | Works correctly | Works correctly |
| Indoors (poor GPS) | Shows erratic movement | Ignores low-accuracy points, shows 0 |
| User drags map | Map snaps back to vehicle | Stays where user dragged |
| Vehicle speeds unrealistically | Shows 999 mph | Capped/zeroed |

## Technical Notes

- Uses Leaflet for mapping (no Google Maps/Mapbox)
- OpenStreetMap tiles via CartoDB Voyager
- Supabase Realtime for instant updates
- Component is fully self-contained
- No external dependencies beyond existing stack
