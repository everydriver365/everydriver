

# Speed Up Live Map Updates

## Current Bottleneck

The map marker and polyline can only update when new data arrives in the database. Right now:

- The **Geotab poller** (which fetches GPS data from your tracker) is triggered every **30 seconds** when moving, or **60 seconds** when idle — and only from the Vehicle Health page, not the live tracking page itself
- The **snap-to-road** polyline refresh runs every **5 seconds**, which is fine
- **Realtime subscription** delivers updates instantly once data hits the database

So the real delay is: your tracker data only gets pulled every 30-60 seconds. The live tracking page doesn't even trigger the poller on its own.

## Changes

### 1. Trigger the GPS poller directly from the live tracking map (every 10 seconds)

Add a `useEffect` in `GoogleLiveTrackingMap.tsx` that calls the `geotab-poller` backend function every **10 seconds** while the map is open. This means new GPS coordinates arrive 3-6x faster than today.

### 2. Speed up the snap-to-road cycle from 5s to 3s

Reduce the polyline snap-to-road interval from 5 seconds to 3 seconds so the clean road-aligned line catches up faster after new data arrives.

### 3. Reduce the front-end device data polling (bonus)

The `useVehicleHealth` hook polls the database every 10-30s. On the live tracking page, the Realtime subscription already handles instant updates, so this is fine as-is. The key improvement is pulling data from the tracker more often (change 1).

## Technical Details

### File: `src/components/instructor/GoogleLiveTrackingMap.tsx`

**Add poller trigger effect (new effect, after effect #4):**
- Call `supabase.functions.invoke("geotab-poller")` every 10 seconds while the component is mounted and a device is active
- Only trigger when `device?.id` exists and `isConnected` is true
- Clean up interval on unmount

**Reduce snap-to-road interval (Effect #5, line 375):**
- Change `setInterval(tick, 5000)` to `setInterval(tick, 3000)`

### No other files changed. No database or backend changes needed.

