
# Tracking Speed Detection Delay and Speed Limit Fix

## Problem Summary

There are two distinct issues with the tracking system:

### 1. Speed Detection Delay
**Root Cause**: The Traccar Client app is sending GPS data at long intervals (approximately every 60 seconds in the current logs). When stationary or with poor GPS signal, the app reports `speed: -1`, which gets converted to negative km/h values.

**Contributing Factors**:
- Traccar Client's location accuracy and update frequency settings
- The app enters "heartbeat" mode when stationary, reducing update frequency
- Frontend polls device every 3 seconds, but backend data only updates when webhook receives new data

### 2. Speed Limits Are Hardcoded
**Root Cause**: The live map displays a placeholder speed limit of 30 mph, not the actual road speed limit. There's a TODO comment in the code acknowledging this was never implemented.

**Current State**:
- `TraccarLiveMap.tsx` line 291: `const speedLimitMph = 30; // Placeholder`
- The `telematics_gps_points` table has `speed_limit_kmh` column but it's never populated
- No speed limit API is being called during live tracking

---

## Solution Design

### Part 1: Improve Speed Detection (Traccar Client Configuration)

**User Action Required** - Configure Traccar Client app settings:
1. **Location Accuracy**: Set to "High"
2. **Distance**: Set to minimum (e.g., 10 meters)
3. **Interval**: Set to minimum (e.g., 5-10 seconds)
4. **Angle**: Enable movement detection

This is an app configuration issue, not a code issue. The backend correctly processes whatever data Traccar sends.

### Part 2: Fix Speed Limit Display with Real-Time Lookup

**Implementation Strategy**: Use the OpenStreetMap Overpass API (free, no API key required) to fetch real-time speed limits based on GPS coordinates.

#### Step 1: Add Speed Limit Lookup to Webhook

Modify `supabase/functions/traccar-webhook/index.ts` to:
- Call Overpass API with current lat/lon to get road speed limit
- Store speed limit in `telematics_gps_points.speed_limit_kmh`
- Include speed limit in live position update

```typescript
// New function to get speed limit from OpenStreetMap
async function getSpeedLimit(lat: number, lon: number): Promise<number | null> {
  const query = `[out:json][timeout:5];
    way(around:20,${lat},${lon})[highway][maxspeed];
    out tags;`;
  
  const response = await fetch(
    `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
  );
  
  const data = await response.json();
  // Parse maxspeed (e.g., "30 mph" or "50" for km/h)
  // Return speed limit in km/h
}
```

**Caching Strategy**: To avoid API rate limits and reduce latency:
- Cache speed limit by road segment (lat/lon rounded to ~50m grid)
- Only call API when road changes or cache expires
- Store last known speed limit in device record

#### Step 2: Update Live Position RPC

Modify the `update_live_position` database function to accept and store speed limit:
- Add `p_speed_limit_kmh` parameter
- Store in `live_pupil_positions` table (may need new column)

#### Step 3: Update Frontend to Display Real Speed Limit

Modify `TraccarLiveMap.tsx`:
- Accept speed limit as prop from parent component
- Remove hardcoded `speedLimitMph = 30`
- Display actual speed limit or "Unknown" when not available

#### Step 4: Update Parent Component

Modify `InstructorTraccarSession.tsx`:
- Fetch speed limit from device or session data
- Pass to TraccarLiveMap component

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/traccar-webhook/index.ts` | Add Overpass API call, store speed limit, include in GPS points |
| `src/components/instructor/TraccarLiveMap.tsx` | Accept `speedLimitKmh` prop, remove hardcoded value |
| `src/pages/InstructorTraccarSession.tsx` | Pass speed limit to map component |
| Database migration | Add `speed_limit_kmh` column to `live_pupil_positions` if needed |

---

## Technical Considerations

### Overpass API Rate Limits
- Free tier: ~10,000 requests/day recommended
- Will cache results to minimize calls
- Fallback to null if API fails (show "Unknown" on map)

### UK Speed Limit Format
- UK uses mph on signs but OSM stores km/h or mph depending on mapper
- Need to parse values like "30 mph", "50", "30" and convert to consistent unit
- National speed limit = 60 mph (single carriageway) or 70 mph (dual carriageway)

### Latency Mitigation
- Make API call async, don't block GPS point processing
- Use last known speed limit if API is slow
- Cache aggressively since speed limits don't change frequently

---

## Rollout Steps

1. **Deploy webhook update** with speed limit lookup
2. **Test with active session** - verify speed limits appear in GPS points
3. **Deploy frontend update** - verify map shows real speed limits
4. **Update Traccar Client settings** - reduce GPS update interval

---

## Expected Outcome

After implementation:
- Live map shows actual road speed limit (or "Unknown" if not available)
- Speed limit updates when driving on different roads
- GPS points have speed limit data for post-session analysis
- Speed compliance reporting becomes accurate

---

## Traccar Client Configuration Guide

Share these settings with the user:

1. Open Traccar Client app
2. Go to Settings/Status
3. Set **Location Accuracy** → High
4. Set **Interval** → 5 seconds (or minimum)
5. Set **Distance** → 10 meters (or minimum)
6. Enable **Angle** → 10 degrees
7. Ensure **Service Status** is ON

This will make the device send location updates much more frequently, reducing the perceived "delay" in speed detection.
