
# Fix: "No Recent GPS Updates" False Alarm on Tracking Page

## Problem

Your Geotab device IS connected and working. The database shows:
- `last_seen_at`: updating every ~20-40 seconds
- `last_heartbeat_at`: updating every ~10 seconds (poller is healthy)
- `last_ignition_status`: true

But the tracking page shows "Offline / No recent GPS updates" because during an active session, it requires `last_seen_at` to be within **30 seconds**. Geotab devices can easily have 30-40 second gaps between position updates, especially when stationary.

This is the same issue we already fixed in the Vehicle Health Hub -- the tracking page was never updated to use `last_heartbeat_at`.

## Fix

### 1. Add `last_heartbeat_at` to the device data model

In `src/pages/InstructorLiveSession.tsx`, add `last_heartbeat_at` to the `GPSDevice` interface and to the device fetch query.

### 2. Update the connectivity check (lines 711-722)

Replace the simple `secondsSinceTrack < 30` check with the same logic used in `useVehicleHealth`:

```
Active session connected if:
  - last_seen_at < 60 seconds ago (actively reporting)
  - OR last_heartbeat_at < 120 seconds AND last_seen_at < 30 minutes (stationary but poller healthy)
```

This matches the proven pattern from the Vehicle Health Hub and eliminates false "offline" alerts for stationary vehicles.

## Technical Details

**File:** `src/pages/InstructorLiveSession.tsx`

**Changes:**
1. Add `last_heartbeat_at: string | null` to the `GPSDevice` interface (line ~35)
2. Add `last_heartbeat_at` to the device SELECT query
3. Update lines 711-722 to calculate `secondsSinceHeartbeat` and use it in the `isConnected` check:

```typescript
const trackTime = device?.last_seen_at;
const heartbeatTime = device?.last_heartbeat_at;
const secondsSinceTrack = trackTime
  ? Math.floor((Date.now() - new Date(trackTime).getTime()) / 1000)
  : 9999;
const secondsSinceHeartbeat = heartbeatTime
  ? Math.floor((Date.now() - new Date(heartbeatTime).getTime()) / 1000)
  : 9999;

const ignitionOff = device?.last_ignition_status === false;
const isConnected = isSessionActive
  ? secondsSinceTrack < 60 || (secondsSinceHeartbeat < 120 && secondsSinceTrack < 1800)
  : secondsSinceTrack < 300 || (ignitionOff && secondsSinceTrack < 86400);
```

This gives a 60-second window for active reports (up from 30s) and falls back to the heartbeat check for stationary vehicles, matching the rest of the app.
