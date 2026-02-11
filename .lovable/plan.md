
# Reliable Live Tracking - Ground-Up Fix

## Problem Summary

The live tracking has multiple overlapping systems fighting each other, causing:
- Wrong speed display (stale Quartix speed leaking through)
- Map marker not moving (conflicting update paths)
- No tracking line drawn (GPS points not recording or being rejected by validation)
- "Insufficient GPS data" on session end (consequence of no points)

## Root Causes

1. **Stale speed from Quartix**: Quartix sometimes reports a non-zero `Speed` field even when the vehicle is parked. The current "force to 0 if moved less than 5m" logic compares against the DB's `last_latitude`, which is correct, but the 5m threshold is too tight for GPS drift.

2. **GPS points not recording reliably**: The poller fetches the device list (including `current_session_id`) once at the top of the poll cycle. This is correct. The real issue is that during testing, sessions were short or the poller wasn't deployed with the recording code yet.

3. **Map has 3 competing update paths**: (a) Props from device state, (b) Realtime subscription on `telematics_gps_points`, (c) Props-based point addition effect. These fight each other and the 500m max-distance validator in the realtime path rejects valid position changes.

4. **Over-engineering**: Speed limit lookups (Overpass API), reverse geocoding (Nominatim), geofence checks, and unauthorised movement checks ALL happen inside each poll cycle, adding latency and potential failures that slow down the core position update.

## Plan

### Step 1: Simplify the Edge Function (quartix-poller)

Make the core update path fast and reliable:

- Move the device query to fetch `current_session_id` fresh for each vehicle (not once at start)
- Remove the speed-zeroing logic based on displacement. Instead, trust Quartix `Speed` field but zero it when `Ignition` is explicitly OFF or LocationText contains "Stationary"
- Move slow operations (speed limit lookup, reverse geocoding, geofence checks, unauthorised movement checks) to run AFTER the core position update, so they don't block the critical path
- Add error handling that doesn't swallow failures silently

### Step 2: Simplify LiveTrackingMap Component

Remove the competing update paths and keep it simple:

- **Remove** the realtime subscription on `telematics_gps_points` (the realtime sub on `gps_devices` already provides instant updates)
- **Remove** the props-based point addition effect (redundant with the main data flow)
- Instead, use a single data flow: props change -> update marker position -> add to polyline -> auto-center map
- **Remove** the `validatePoint` function with its 500m max distance filter. Use only a simple 3m jitter filter
- Keep route history loading from `telematics_gps_points` on session start (for resuming)

### Step 3: Simplify Speed Display

- Speed comes from `device.last_speed_kmh` (set by poller from Quartix data)
- Only filter: if below 2 km/h, show 0. No other processing needed
- Remove `processSpeed` function complexity

### Step 4: Ensure GPS Point Recording Works

- In the poller, always insert a point when `current_session_id` is set and coordinates are valid
- Only skip if lat/lng are null
- Distance calculation: keep the haversine segment approach but with a 3m minimum (not 5m)
- Log any insert errors clearly

## Technical Details

### Files to modify:
1. `supabase/functions/quartix-poller/index.ts` - Simplify core loop, move slow operations after update
2. `src/components/instructor/LiveTrackingMap.tsx` - Remove competing update paths, simplify to single data flow

### Data flow after fix:

```text
Quartix API -> quartix-poller -> gps_devices table (position, speed, road)
                              -> telematics_gps_points table (if session active)
                                     |
gps_devices realtime + 5s poll -> InstructorLiveSession (device state)
                                     |
                              -> LiveTrackingMap props (lat, lng, speed, heading)
                                     |
                              -> Update marker, polyline, speed display
```

### What gets removed:
- `telematics_gps_points` realtime subscription in map (redundant)
- Props-based point addition effect (redundant)
- `validatePoint` function with 500m max distance (over-filtering)
- Speed limit lookup per poll (move to async background, or only check every 30s)
- The displacement-based speed zeroing in poller

### What stays:
- Route history loading from `telematics_gps_points` on session start
- Simple jitter filter (3m minimum movement to add polyline point)
- Realtime subscription on `gps_devices` in the live session page
- 5s fallback polling of `gps_devices`
- GPS point recording in poller during active sessions
- Haversine distance accumulation for total distance
