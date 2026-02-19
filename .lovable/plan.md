
# Fix: Geotab Device Lockout Loop

## Root Cause

The previous fix made the poller SET `is_active` based on Geotab's `isDeviceCommunicating` flag (line 294). But the poller also READS `is_active` as a filter (line 182):

```
.eq("is_active", true)
```

This creates a self-reinforcing lockout:
1. Geotab briefly reports `isDeviceCommunicating: false`
2. Poller sets `is_active = false` in the database
3. Next poll cycle, the device is filtered OUT because `is_active = false`
4. Device never gets polled again, stays permanently "offline"

Your device is stuck in this state right now: `is_active: false`, `last_seen_at: 2026-02-18 20:37:59` (over 11 hours stale), even though the poller heartbeat is current (08:14).

## Fix (2 changes)

### 1. Poller: Remove `is_active` filter (line 182)

The poller should query ALL Geotab devices regardless of `is_active`, since `is_active` is an OUTPUT of the poller, not a precondition. Remove:

```
.eq("is_active", true)
```

This ensures a device that was temporarily marked inactive will be picked up again on the next poll.

### 2. Poller: Stop writing `is_active` from Geotab flag (line 294)

Since `is_active` is unreliable from Geotab and causes lockouts, stop setting it in the update payload. The frontend already determines status purely from timestamps -- `is_active` in the DB is no longer used for anything meaningful.

Remove this line from the update:
```
is_active: isCommunicating,
```

Also remove the now-unused `isCommunicating` variable (line 278).

### 3. Immediate data fix

Reset the stuck device's `is_active` back to `true` so it starts being polled again immediately (via a one-time migration).

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/geotab-poller/index.ts` | Remove `.eq("is_active", true)` filter (line 182) and remove `is_active: isCommunicating` from update payload (line 294) |
| Database migration | `UPDATE gps_devices SET is_active = true WHERE tracking_provider = 'geotab'` to unstick the current device |
