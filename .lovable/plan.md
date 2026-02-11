

# Fix Live Tracking: Connection Status, Speed Display, and Map Rendering

## Problems Identified

After thorough investigation, the GPS tracking data is flowing correctly from Quartix through the edge function into the database. The device shows valid data (coordinates, speed at 45 km/h, speed limit at 64 km/h, last seen ~4 min ago). The issues are all on the **client side**:

### 1. Connection Status Shows "Reconnecting" Incorrectly
The connection check uses a 120-second threshold for idle mode, but when the page first loads, the poller hasn't run yet so `last_seen_at` may be older than 120 seconds. This causes:
- The status to show "Offline" or "Reconnecting" even though the tracker is working fine
- The `useGPSAutoReconnect` hook enters a reconnection loop that just checks `last_seen_at` but doesn't actually trigger a poll

**Fix**: On page load, immediately invoke the poller before evaluating connection status. Also increase the idle threshold to 5 minutes (300s) since the poller only runs every 10s when idle and Quartix itself may report on longer intervals.

### 2. Speed and Speed Limit Hidden When "Disconnected"
Lines 843-844 in `InstructorLiveSession.tsx` pass `null` for speed and speed limit when `isConnected` is false:
```
speedKmh={isConnected ? device.last_speed_kmh : null}
speedLimitKmh={isConnected ? (device.last_speed_limit_kmh ?? speedLimitKmh) : null}
```
This means any brief "disconnected" state hides all telemetry data.

**Fix**: Always pass the actual device values regardless of connection status. The speed display panel and map already handle null/zero values gracefully.

### 3. Map Shows "Waiting for GPS" When Data Exists
The `LiveTrackingMap` shows a loading spinner overlay when `latitude === null || longitude === null`, blocking the entire map even if valid coordinates exist in the device record but haven't been passed through yet.

**Fix**: Remove the connection-gate on coordinate props so the map always receives the latest known position.

### 4. Poller Not Triggering Fast Enough on Page Load
The `useGPSPoller` hook fires on mount but the first poll may take a moment. Meanwhile, the connection status is evaluated against stale `last_seen_at` data, causing a flash of "Reconnecting".

**Fix**: Trigger an immediate poll on page mount, and don't show "Reconnecting" until at least 2 poll cycles have completed without fresh data.

## Technical Changes

### File: `src/pages/InstructorLiveSession.tsx`
- Change idle connection threshold from 120s to 300s (5 minutes) to account for Quartix reporting intervals
- Always pass actual speed/speedLimit/coordinates to `LiveTrackingMap` regardless of connection state
- Add a brief grace period on mount before showing "Reconnecting" (suppress reconnect animation for first 10 seconds)
- Pass speed and speed limit props directly without the `isConnected` gate

### File: `src/hooks/useGPSAutoReconnect.ts`
- Add an initial grace period (15 seconds) before triggering reconnection logic on first mount
- This prevents the "Reconnecting" flash when the page loads and the poller hasn't had time to refresh the device data
- Increase the connection check threshold from 120s to 300s to match the page

### File: `src/components/instructor/tracking/GPSStatusHero.tsx`
- Show speed and road name in the telemetry section even when status is not "connected" (just dim it slightly to indicate it may be stale)
- This ensures the user always sees the last known speed and location

### File: `src/components/instructor/LiveTrackingMap.tsx`
- Only show the "Waiting for GPS" overlay when there is truly no position data at all (not just when briefly disconnected)
- Show the map with last known position even during brief disconnections

## Expected Outcome
- The tracking page will load and immediately show the last known position on the map
- Speed and speed limit will always be visible (with the last known values)
- "Reconnecting" will only appear after a genuine extended loss of data (not on every page load)
- The map will render immediately with the device's stored coordinates instead of showing a spinner
