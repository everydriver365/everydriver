
# Why Speed Limit Shows "—" and How to Fix It

## Root Cause Identified

The speed limit detection is **working correctly** after the 50m radius fix, but the roundel shows "—" because:

1. **No Active Tracking Session**: The device is sending heartbeats but doesn't have a `current_session_id` set. Without an active session, the webhook doesn't save GPS points or update the `live_pupil_positions` table where the speed limit is displayed from.

2. **Previous Sessions Used Old Code**: Today's earlier session data (recorded at `16:04`) was captured before the updated webhook was deployed, so all those GPS points have `speed_limit_kmh: null`.

3. **Overpass API Intermittent Timeouts**: The OpenStreetMap Overpass API is returning 504 errors on some requests (seen at 17:08:10 and 17:09:10), causing some lookups to fail even with the larger radius.

## Evidence from Logs

**Speed limits ARE being found successfully:**
```
2026-01-28T17:07:11Z - Speed limit found: 30 mph → 48 km/h
2026-01-28T17:07:10Z - Speed limit found: 30 mph → 48 km/h
```

**But some requests timeout:**
```
2026-01-28T17:09:10Z - Overpass API error: 504
2026-01-28T17:08:10Z - Overpass API error: 504
```

## Solution

### 1. Test With an Active Session
Start a new tracking session with a pupil selected. The speed limit will then be recorded and displayed in the roundel.

### 2. Add Cache Fallback for API Failures (Recommended Enhancement)

Modify the speed limit lookup to return the last known cached value when the API times out, rather than returning null:

**File:** `supabase/functions/traccar-webhook/index.ts`

```typescript
async function getSpeedLimit(lat: number, lon: number): Promise<number | null> {
  const gridKey = getGridKey(lat, lon);
  
  // Check cache first
  const cached = speedLimitCache.get(gridKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    console.log(`[Traccar] Speed limit from cache: ${cached.limit} km/h`);
    return cached.limit;
  }
  
  console.log(`[Traccar] Speed limit lookup at ${lat.toFixed(6)},${lon.toFixed(6)}`);
  
  try {
    // ... existing API call ...
    
    // Cache the result
    speedLimitCache.set(gridKey, { limit: speedLimit, timestamp: Date.now() });
    return speedLimit;
    
  } catch (err) {
    console.log(`[Traccar] Speed limit lookup failed:`, err);
    
    // NEW: Return stale cache if API fails (better than nothing)
    if (cached) {
      console.log(`[Traccar] Using stale cache due to API error: ${cached.limit} km/h`);
      return cached.limit;
    }
    
    return null;
  }
}
```

### 3. Add Nearby Grid Fallback (Optional Enhancement)

When no speed limit is found for the current grid cell, check adjacent cells for a recent cached value:

```typescript
// Check adjacent grid cells for cached speed limits
function getNearbySpeedLimit(lat: number, lon: number): number | null {
  const offsets = [
    [0, 0.0005], [0, -0.0005], [0.0005, 0], [-0.0005, 0]
  ];
  
  for (const [dLat, dLon] of offsets) {
    const key = getGridKey(lat + dLat, lon + dLon);
    const cached = speedLimitCache.get(key);
    if (cached && cached.limit !== null) {
      return cached.limit;
    }
  }
  return null;
}
```

## Expected Outcome

After implementing these changes:
1. **Active sessions will show speed limits** in the roundel (30 mph example)
2. **API timeouts won't cause the display to go blank** - stale cache will be used
3. **Smoother experience** as you drive between grid cells

## Testing Steps

1. Start a new tracking session with a pupil
2. Drive on a road with a known speed limit in OpenStreetMap
3. Verify the speed limit roundel shows the correct number (e.g., "30")
4. Speed limit should persist even if API has brief outages
