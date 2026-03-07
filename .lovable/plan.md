

## App Analysis -- Issues Found

### 1. Missing Edge Function: `gpsgate-poller` (Error-level)

**File:** `src/hooks/useVehicleHealth.ts` line 86

The `useVehicleHealth` hook calls `supabase.functions.invoke("gpsgate-poller")` every 30-60 seconds, but no `gpsgate-poller` function exists in `supabase/functions/`. Only `geotab-poller` exists. This causes repeated "Failed to fetch" network errors visible in the network tab right now.

**Fix:** Change `"gpsgate-poller"` to `"geotab-poller"` in `useVehicleHealth.ts`.

---

### 2. Excessive Polling -- Redundant with Realtime Subscriptions (Performance)

Several hooks poll aggressively while *also* having realtime subscriptions on the same data, wasting bandwidth and API quota:

| Hook/Component | Poll Interval | Also Has Realtime? |
|---|---|---|
| `useActiveTrackingPupils.ts` | **1 second** | Yes (postgres_changes on `live_pupil_positions`) |
| `InstructorBottomNav.tsx` | **2 seconds** | No |
| `GPSStatusPanel.tsx` | **2 seconds** | Yes (postgres_changes on `live_pupil_positions`) |

The network requests confirm this: `gps_devices?select=current_session_id` fires every 2 seconds continuously from the bottom nav, even when there's no active session.

**Fixes:**
- `useActiveTrackingPupils`: Remove the 1s `setInterval` entirely -- the realtime subscription already calls `fetchActiveIds()` on every change. Keep only an initial fetch.
- `InstructorBottomNav`: Increase polling from 2s to 10-15s, or switch to a realtime subscription.
- `GPSStatusPanel`: Remove the 2s interval since it has realtime. Keep only initial fetch.

---

### 3. Comment Contradicts Code in `useActiveTrackingPupils` (Minor)

Line 37 says "polling every 10s" but line 45 sets it to 1000ms (1 second).

---

### Summary of Changes

| File | Change |
|---|---|
| `src/hooks/useVehicleHealth.ts` | Fix function name `gpsgate-poller` -> `geotab-poller` |
| `src/hooks/useActiveTrackingPupils.ts` | Remove 1s polling interval (realtime subscription handles it) |
| `src/components/instructor/InstructorBottomNav.tsx` | Reduce polling from 2s to 15s |
| `src/components/admin/GPSStatusPanel.tsx` | Remove 2s polling interval (realtime subscription handles it) |

All changes are small, contained edits. No database migrations needed.

