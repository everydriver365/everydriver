

## Fix: GPS Status Always Shows "Offline"

### Root Cause

The database has two devices for this instructor:

| Device | Provider | is_active | last_seen_at |
|--------|----------|-----------|-------------|
| Kenneth's Geotab | geotab | **true** | 09:21 (stale — poller deleted) |
| 861778063583081 | radius | **false** | 09:12 |

`useGPSConnectionStatus` queries `gps_devices` ordered by `last_seen_at DESC` with **no provider filter**. It picks the Geotab device every time. Since `geotab-poller` was deleted, that device's timestamps go stale → always "offline".

The Radius device also has `is_active = false`, so even adding a filter alone won't fix it.

### Plan

**1. Filter `useGPSConnectionStatus` to Radius-only**
- Add `.eq("tracking_provider", "radius")` to the query in `checkConnection()`
- Remove the `is_active` requirement (or use `.order("last_seen_at")` without filtering on `is_active`) so the Radius device is found regardless

**2. Fix the Radius device's `is_active` flag via migration**
- Run a migration to set `is_active = true` for all Radius devices and `is_active = false` for all Geotab devices
- This ensures the Radius device is the canonical active device going forward

**3. Deactivate the Geotab device row**
- The same migration marks the Geotab device as `is_active = false` so it never surfaces in any query

These are small, targeted changes — one line in the hook query and one short migration.

