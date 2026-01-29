
# Complete Tracking System Fix: Mapbox Speed Limits + Test Route Mode

## Overview

This plan addresses two issues:
1. **Replace OSM with Mapbox** for more accurate speed limit detection in the UK
2. **Fix Test Route mode** so GPS points record correctly even without a pupil selected

## Changes Summary

| Component | Change |
|-----------|--------|
| Backend Secret | Add `MAPBOX_TOKEN` secret |
| `traccar-webhook` | Replace OSM Overpass API with Mapbox Map Matching API |
| `traccar-webhook` | Remove pupil requirement for GPS point recording (line 377) |
| `TraccarLiveMap.tsx` | Keep existing code (no changes needed - already correct) |
| `InstructorTraccarSession.tsx` | No changes needed (already reads from device table) |

## Technical Implementation

### 1. Add Mapbox Secret

Before deployment, you'll need to provide your Mapbox access token. This will be stored securely in the backend and never exposed to the frontend.

### 2. Update traccar-webhook Edge Function

**Replace OSM speed limit lookup with Mapbox Map Matching API:**

The current OSM Overpass API (lines 100-188) will be replaced with Mapbox's Map Matching API which provides:
- More accurate road matching
- Reliable speed limit data in the UK
- Faster response times (dedicated commercial API)

**Mapbox Map Matching endpoint:**
```text
POST https://api.mapbox.com/matching/v5/mapbox/driving/{coordinates}
  ?access_token=YOUR_TOKEN
  &annotations=maxspeed
```

**Response structure:**
```json
{
  "matchings": [{
    "legs": [{
      "annotation": {
        "maxspeed": [{ "speed": 48, "unit": "km/h" }]
      }
    }]
  }]
}
```

**Key changes in the webhook:**

```typescript
// Replace getRoadInfo() function with Mapbox version
async function getRoadInfo(lat: number, lon: number): Promise<{ speedLimit: number | null; roadName: string | null }> {
  const MAPBOX_TOKEN = Deno.env.get("MAPBOX_TOKEN");
  if (!MAPBOX_TOKEN) {
    console.log("[Traccar] MAPBOX_TOKEN not configured, skipping speed limit lookup");
    return { speedLimit: null, roadName: null };
  }

  // Create two points 10m apart for Map Matching API
  const offset = 0.0001; // ~10m
  const coords = `${lon},${lat};${lon + offset},${lat + offset}`;
  
  const response = await fetch(
    `https://api.mapbox.com/matching/v5/mapbox/driving/${coords}?access_token=${MAPBOX_TOKEN}&annotations=maxspeed&geometries=geojson`,
    { signal: AbortSignal.timeout(3000) }
  );

  const data = await response.json();
  
  // Extract speed limit from first leg annotation
  const maxspeed = data.matchings?.[0]?.legs?.[0]?.annotation?.maxspeed?.[0];
  let speedLimit = null;
  
  if (maxspeed && !maxspeed.unknown) {
    speedLimit = maxspeed.unit === "km/h" 
      ? maxspeed.speed 
      : Math.round(maxspeed.speed * 1.60934); // Convert mph to km/h
  }

  // Get road name from tracepoint
  const roadName = data.tracepoints?.[0]?.name || null;

  return { speedLimit, roadName };
}
```

### 3. Fix Test Route GPS Recording

**Current code (line 377):**
```typescript
if (typedDevice.current_session_id && typedDevice.current_pupil_id) {
```

**Fixed code:**
```typescript
if (typedDevice.current_session_id) {
```

This single change enables:
- GPS point recording for Test Routes (no pupil)
- Driving Test mode recording
- Route polyline display for all session types
- Distance tracking for all sessions

**Additional change for live position RPC:**
The `update_live_position` RPC requires a pupil_id, so we wrap it conditionally:

```typescript
// Only update live_pupil_positions if a pupil is assigned
if (typedDevice.current_pupil_id) {
  const { error: liveError } = await supabase.rpc("update_live_position", {
    p_pupil_id: typedDevice.current_pupil_id,
    // ... rest of params
  });
}
```

## Data Flow After Fix

```text
Traccar App sends GPS data
        ↓
traccar-webhook receives data
        ↓
+--→ Mapbox Map Matching API (speed limit + road name)
        ↓
traccar_devices table updated (always)
  - last_speed_kmh
  - last_latitude/longitude
  - last_speed_limit_kmh  ←── Mapbox data
  - last_road_name        ←── Mapbox data
        ↓
telematics_gps_points recorded (if session active - pupil optional)
        ↓
live_pupil_positions updated (only if pupil assigned)
        ↓
Frontend reads from traccar_devices via Realtime subscription
        ↓
TraccarLiveMap displays speed + speed limit + route
```

## Speed Conversion Chain (Unchanged)

1. **Traccar Client** sends speed in m/s
2. **Webhook** converts: `speedKmh = speedMs * 3.6`
3. **Mapbox** returns speed limit in km/h or mph (converted)
4. **Database** stores both in km/h
5. **Frontend** filters stationary noise (3 km/h threshold)
6. **Display** converts to mph: `speedMph = kmh * 0.621371`

## Files Modified

| File | Changes |
|------|---------|
| `supabase/functions/traccar-webhook/index.ts` | Replace OSM with Mapbox API; Remove pupil requirement for GPS recording |

## Frontend Files (No Changes)

The existing frontend code is already correct:
- `TraccarLiveMap.tsx` - Already has 3 km/h filter, realtime subscriptions, route polyline
- `InstructorTraccarSession.tsx` - Already reads speed limit from `device.last_speed_limit_kmh`

## Caching Strategy

The grid-based cache (50m resolution, 5-minute TTL) will be retained for Mapbox to:
- Reduce API costs
- Improve response times
- Handle API rate limits gracefully

## Fallback Behavior

If Mapbox API fails:
1. Check nearby grid cells for cached values
2. Use stale cache if available
3. Return null (speed limit displays as "—")

## After Implementation

1. **Add your Mapbox token** when prompted
2. **Publish** the app to deploy the updated webhook
3. **Test** by starting a Test Route session and verifying:
   - Speed limit displays correctly
   - Route polyline draws on the map
   - Speed shows 0 mph when stationary (3 km/h filter)
