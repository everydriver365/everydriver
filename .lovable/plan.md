

## Plan: Only poll GPS when a session is active

### Problem
The tracking page triggers the `radius-poller` edge function every 2 seconds and polls the database every 5 seconds as soon as a device is found — even when no session is active. This wastes resources and creates unnecessary network traffic.

### Changes

**File: `src/pages/InstructorLiveSession.tsx`**

1. **Gate the 2-second `radius-poller` invocation** behind `isSessionActive` — only trigger the poller when `device.current_session_id` is set (i.e., a session has been manually started).

2. **Gate the 5-second fallback DB poll** the same way — when no session is active, do a single initial fetch for device status but skip the recurring interval.

3. **Keep the Realtime subscription** for `gps_devices` changes (it's lightweight and ensures the UI updates if a session starts from elsewhere), but stop the aggressive polling loops when idle.

### Specifically

- Move the `triggerPoller` + `setInterval(triggerPoller, 2000)` block inside a condition: only run when `device.current_session_id` is truthy.
- Move `setInterval(pollDevice, 5000)` inside the same condition — keep the single initial `pollDevice()` call so the page loads device info on mount.
- This means when the instructor opens the tracking page without an active session, no recurring network calls fire. Once they start a session (which sets `current_session_id`), the polling begins automatically via the existing `useEffect` dependency on `device?.id`.

### No other files need changes
The `SatNavLiveMap`, `LessonRouteRecorder`, and other components already respond passively to props — they don't initiate their own polling.

