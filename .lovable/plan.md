
# Fix Speed Limit Detection in Live Tracking

## Problem Identified

Testing revealed that the OpenStreetMap Overpass API integration is working, but the **search radius is too small (20m)**. Real-world GPS accuracy can be 5-20m off the actual road centerline, causing the API to return no results.

**Evidence:**
- With 20m radius: Empty results (no roads found)
- With 100m radius: Successfully returns `30 mph` speed limit for Maunsell Way

Additionally, all previous tracking sessions show `speed_limit_kmh: null` because this feature was deployed after those sessions.

## Solution

Increase the Overpass API search radius from 20m to 50m for more reliable speed limit detection while still maintaining reasonable specificity.

## Technical Changes

### 1. Update Edge Function Radius

**File:** `supabase/functions/traccar-webhook/index.ts`

Change line 94 from:
```typescript
way(around:20,${lat},${lon})[highway][maxspeed];
```

To:
```typescript
way(around:50,${lat},${lon})[highway][maxspeed];
```

This increases the search radius to 50 meters, which should:
- Account for typical GPS accuracy (5-20m)
- Still be specific enough to find the correct road
- Work for most road types including narrow residential streets

### 2. Add Fallback Logging

Add more detailed logging to help diagnose any remaining issues:

```typescript
console.log(`[Traccar] Speed limit lookup at ${lat},${lon}`);

// After API call
if (data.elements.length === 0) {
  console.log(`[Traccar] No roads with maxspeed found within 50m`);
}
```

## Expected Outcome

After this fix:
1. Speed limits will be detected for roads that have them in OpenStreetMap
2. The UK-style roundel on the live map will show actual speed limits instead of "—"
3. Speeding alerts will be generated when exceeding the road's speed limit
4. GPS points will be saved with speed limit data for post-session analysis

## Traccar Client Settings Reminder

To reduce the delay in speed detection (separate from speed limit lookup), update the Traccar Client app:

1. **Location Accuracy:** High
2. **Interval:** 5-10 seconds (currently appears to be ~60s)
3. **Distance:** 10 meters
4. **Angle:** 10 degrees
5. **Service Status:** ON

The current logs show the device is sending data approximately every 2 minutes in heartbeat mode, which is too infrequent for responsive speed tracking.

## Testing Plan

After deployment:
1. Start a new tracking session with a selected pupil
2. Drive on roads known to have speed limits in OpenStreetMap
3. Verify the speed limit roundel updates as you travel
4. Check that `telematics_gps_points` records have `speed_limit_kmh` populated
5. Test speeding alerts by exceeding the speed limit by more than 5 km/h
