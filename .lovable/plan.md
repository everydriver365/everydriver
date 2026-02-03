

# Fix GPSgate Position, Road Name, and Speed Limit Display

## Problem Identified

The live tracking page shows wrong location, no road name, and no speed limit because:

1. **GPSgate returns no position data** - The edge function logs show `0.0km/h at undefined,undefined`, meaning the GPS position fields are not being read correctly from the GPSgate API response
2. **Old Traccar data still visible** - The map shows stale coordinates from January 31st (the old Traccar system), not fresh GPSgate data
3. **Road name shows "Undefined"** - Without valid GPS coordinates, the Mapbox geocoding lookup fails

## Technical Root Cause

Looking at the `gpsgate-poller` edge function:
- The code expects `latestTrack.Lat` and `latestTrack.Lng` from the GPSgate `/tracks` endpoint
- The API may be returning data in a different format (e.g., `latitude`, `Latitude`, or nested `Position.Lat`)
- Need to add debug logging to see the actual API response structure

## Implementation Plan

### Phase 1: Add Debug Logging to Discover GPSgate Response Format

**File: `supabase/functions/gpsgate-poller/index.ts`**

1. Add detailed logging when fetching tracks to see the raw API response:
   - Log the first track point structure to identify correct field names
   - Log if tracks are empty vs missing position fields

2. Handle multiple possible field name formats:
   - Check for `Lat/Lng`, `lat/lng`, `Latitude/Longitude`, `latitude/longitude`
   - Check for nested structures like `Position.Lat` or `Location.Latitude`

### Phase 2: Fix Track Position Parsing

Update the track parsing logic to:

1. Create a helper function `extractPosition(trackPoint)` that tries multiple field patterns:
   ```
   - trackPoint.Lat, trackPoint.Lng
   - trackPoint.lat, trackPoint.lng
   - trackPoint.Latitude, trackPoint.Longitude
   - trackPoint.latitude, trackPoint.longitude
   - trackPoint.Position?.Lat, trackPoint.Position?.Lng
   ```

2. Similarly for speed:
   ```
   - trackPoint.Speed
   - trackPoint.speed
   - trackPoint.Velocity
   ```

### Phase 3: Use GPSgate `/usersstatus` Endpoint as Alternative

The GPSgate API has a `/usersstatus` endpoint that returns the **last known position** for all users in a single call. This is:
- More efficient (one API call instead of many)
- May provide the current position even if no tracks recorded today

Add fallback logic:
1. Try `/tracks` endpoint first
2. If no tracks or no position, try `/usersstatus` for last known position

### Phase 4: Clear Stale Traccar Data

When GPSgate provides no position:
- Don't fall back to showing old Traccar data (confusing for users)
- Display a "No GPS signal" state instead of wrong location

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/gpsgate-poller/index.ts` | Add debug logging, flexible field parsing, `/usersstatus` fallback |
| `src/components/instructor/TraccarLiveMap.tsx` | Show "No GPS from GPSgate" if position is stale |
| `src/pages/InstructorTraccarSession.tsx` | Display connection status with "Last position: X mins ago" |

## Expected Outcome

After implementation:
1. Console logs will reveal the exact GPSgate response structure
2. Position data will be correctly extracted regardless of field naming
3. Road name and speed limit will populate once we have valid coordinates
4. If GPSgate genuinely has no data, the UI will clearly show "Waiting for GPS" instead of wrong location

## Deployment Steps

1. Deploy updated edge function
2. Check edge function logs for GPSgate response structure
3. Adjust field mappings based on actual response
4. Test with live tracking

