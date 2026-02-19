
# Fix: Use Device-Reported Time and Sync `is_active` from Geotab

## Problem
Two issues in the Geotab poller cause the "connected" status to never go offline:

1. **`last_seen_at` uses server time** (line 284: `new Date().toISOString()`), so every poll cycle refreshes the timestamp even if the device hasn't reported new data in hours.
2. **`is_active` is never updated by the poller** -- Geotab returns `isDeviceCommunicating` but we store it in `last_ignition_status` and never use it to flip `is_active`.

## Solution

**File: `supabase/functions/geotab-poller/index.ts`** (lines 276-288)

Replace the device update block to:

1. **Use the device's actual reported time** from the Geotab `DeviceStatusInfo` response (`dateTime` field) instead of `new Date()`.
2. **Set `is_active` based on `isDeviceCommunicating`** -- when Geotab says the device isn't communicating, flip `is_active` to `false`, which the frontend hook already respects.
3. **Update `last_heartbeat_at` with server time** -- this distinguishes "we polled successfully" from "the device reported a position".

Updated update payload:
```
const geotabSeenAt = status.dateTime || null;
const isCommunicating = status.isDeviceCommunicating !== false;

.update({
  last_latitude: status.latitude,
  last_longitude: status.longitude,
  last_speed_kmh: status.speed,
  last_heading: status.bearing ?? null,
  last_ignition_status: status.isDeviceCommunicating ?? null,
  last_seen_at: geotabSeenAt
    ? new Date(geotabSeenAt).toISOString()
    : null,
  last_heartbeat_at: new Date().toISOString(),
  last_road_name: roadName,
  last_speed_limit_kmh: speedLimitKmh,
  is_active: isCommunicating,
})
```

This single change means:
- When a device is truly offline, Geotab reports `isDeviceCommunicating: false`, the poller sets `is_active = false`, and the frontend hook (already fixed) shows "Offline".
- `last_seen_at` reflects when the device last actually reported a position, not when our server last polled.
- `last_heartbeat_at` tracks poller health separately.
