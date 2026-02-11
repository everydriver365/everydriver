
# Fix Live Tracking: Root Cause Analysis and Comprehensive Solution

## Root Causes Identified

After investigating the database, edge function, and client code, three critical issues are preventing live tracking from working:

### 1. `last_seen_at` Uses Quartix Event Time, Not Poll Time
The quartix-poller edge function sets `last_seen_at` to `pos.LastEventDateTime` from the Quartix API. When the vehicle is stationary or between events, Quartix stops updating this timestamp. The database currently shows `last_seen_at` is **493 seconds old** even though the poller successfully fetched data moments ago.

Since the client uses `last_seen_at` to determine connection status (must be within 300 seconds), the device appears "Offline" even though the poller is working fine and the device data is valid.

**Fix:** Always set `last_seen_at` to `new Date().toISOString()` when the poller receives data from the live API. Store the original Quartix event time in a separate field if needed.

### 2. Ignition Status is Always `null`
The Quartix live API field `pos.Ignition` comes through as `null`/`undefined`, even when the LocationText clearly says "Ignition OFF". The poller uses `pos.Ignition ?? null`, so `last_ignition_status` stays null. This breaks the "Parked" detection logic on the client, which checks `device.last_ignition_status === false`.

**Fix:** Parse ignition state from LocationText as a fallback. If LocationText contains "Ignition OFF" or "Stationary with Ignition OFF", set ignition to `false`. If it contains "Ignition ON" or speed > 0, set to `true`.

### 3. Road Name Shows Raw Quartix LocationText
The `last_road_name` field stores the full Quartix LocationText, e.g.:
> "Stationary with Ignition OFF at Threesixfive (365) Ltd since 11 February 2026 08:36:06 GMT."

This is displayed verbatim in the UI instead of a clean road name like "Maunsell Way, Eastleigh".

**Fix:** Parse the LocationText to extract just the road/location portion. Quartix LocationText follows patterns like:
- "Travelling SE at 21.1 mph on [date]. [Road], [Town], [County]..."
- "Stationary with Ignition OFF at [Place] since [date]."

Extract the meaningful location after the date/status prefix.

## Technical Changes

### File: `supabase/functions/quartix-poller/index.ts`

1. **Add `parseLocationText` helper function** that extracts a clean road name from Quartix's verbose LocationText:
   - For "Travelling..." format: extract the address after the date portion
   - For "Stationary at [Place]..." format: extract the place name
   - Falls back to the full text if parsing fails

2. **Add `parseIgnitionStatus` helper function** that detects ignition state from LocationText when `pos.Ignition` is null:
   - "Ignition OFF" or "Stationary" in text = `false`
   - Speed > 0 or "Ignition ON" = `true`
   - Otherwise = `null`

3. **Change `last_seen_at` to always use current timestamp** when the poller receives live data from Quartix, instead of `pos.LastEventDateTime`. This ensures the "connection" status reflects whether the poller can reach the device, not when the device last generated an event.

4. **Use parsed road name and ignition status** in the database update:
```
last_road_name: parseLocationText(pos.LocationText) || null,
last_ignition_status: pos.Ignition ?? parseIgnitionStatus(pos.LocationText, speedKmh),
last_seen_at: new Date().toISOString(),
```

### No Client-Side Changes Required

The previous round of fixes already:
- Passes speed/coordinates regardless of connection status
- Shows telemetry section when data exists even if "disconnected"
- Uses 300-second threshold with grace period

Once the poller correctly sets `last_seen_at` to the current time, the client will see `secondsSinceTrack` as ~10 seconds (matching the poll interval), making `isConnected = true`. The speed, road name, and map will all render correctly with the existing client code.

## Expected Outcome

- **Connection Status**: Will show "Connected" with green LIVE badge whenever the poller successfully fetches data (every 10 seconds idle, every 2 seconds during session)
- **Speed Display**: Will show actual speed (already in DB, just wasn't visible due to "Offline" status hiding telemetry)
- **Road Name**: Will show clean road names like "Maunsell Way, Eastleigh" instead of the full Quartix description
- **Map Movement**: Map will track the vehicle position since coordinates are being passed through correctly
- **Parked Detection**: When ignition is off, status will correctly show "Parked" instead of "Offline"
