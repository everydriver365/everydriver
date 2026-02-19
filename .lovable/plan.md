

# Simplify GPS Status: Timestamp-Only Approach

## Problem

The current approach relies on the `is_active` database flag (set by the Geotab poller from `isDeviceCommunicating`). This flag may not behave reliably -- Geotab can report `isDeviceCommunicating: true` even when the device hasn't sent fresh position data in a long time, and vice versa.

## New Logic

Remove the `is_active` dependency entirely. Determine connection status purely from the `last_seen_at` timestamp (which now reflects the device's actual reported time from Geotab, not server time):

- **Connected ("active")**: `last_seen_at` is within 60 seconds
- **Connected ("recent")**: `last_seen_at` is within 5 minutes
- **Stationary**: `last_heartbeat_at` is within 2 minutes AND `last_seen_at` is within 30 minutes (poller is running but position hasn't changed)
- **Offline**: everything else (timestamp is stale)

## Technical Changes

**File: `src/hooks/useGPSConnectionStatus.ts`**

1. Remove the `isDeviceActive` state variable
2. Remove `is_active` from the `getStatus()` function signature -- no longer a factor
3. Simplify `getStatus()` to only use `last_seen_at` and `last_heartbeat_at` timestamps
4. Remove `is_active` tracking from the realtime subscription handler
5. Keep `is_active` in the Supabase query (no harm), but don't use it for status determination

The status function becomes:

```
getStatus(trackTime, heartbeat):
  if no trackTime -> "offline"
  if trackTime < 60s ago -> "active"
  if trackTime < 300s ago -> "recent"
  if heartbeat < 120s ago AND trackTime < 1800s ago -> "stationary"
  else -> "offline"
```

This is essentially the same logic that existed before the `is_active` changes, but now it works correctly because `last_seen_at` reflects the actual device-reported time (not server time), thanks to the poller fix we already deployed.
