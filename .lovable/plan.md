

# Fix: "Online" Status Showing When No Device Is Connected

## Problem
The GPS connection status indicator on the instructor home page shows "Online" even when no device should be actively connected. This happens because the status hook (`useGPSConnectionStatus`) only checks `last_seen_at` timestamps to determine connectivity -- it does not check the `is_active` flag on the device record.

Since the background poller updates `last_seen_at` frequently, the timestamp is always recent, making the device appear perpetually "Online."

## Solution
Update `useGPSConnectionStatus` to also query the `is_active` field from `gps_devices`, and factor it into the connection status logic. A device should only be considered connected if `is_active` is `true` AND the timestamps are recent.

## Technical Detail

**File: `src/hooks/useGPSConnectionStatus.ts`**

1. Add `is_active` to the Supabase select query (line ~58).
2. Add a new `isActive` state variable to track the device's active flag.
3. Update `getStatus()` to return `"offline"` immediately when `isActive` is `false`.
4. Update the realtime subscription handler to also track changes to `is_active`.

This ensures:
- If no device exists for the instructor: shows "Offline" (already works, query returns null).
- If a device exists but `is_active = false`: shows "Offline" (new behavior).
- If a device exists, `is_active = true`, and timestamps are recent: shows "Online" (existing behavior preserved).
