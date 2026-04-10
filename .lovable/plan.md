

## Reduce Live Tracking Delay via Realtime Subscriptions

### Problem
The client polls the database every 5 seconds. Even though the poller writes new positions promptly, the client may wait up to 5 seconds to see them.

### Solution
Replace the 5-second polling loop for GPS trail data with a Supabase Realtime subscription on `telematics_gps_points`. Keep the poller trigger interval at 5 seconds (it still needs to kick the edge function). The trail/marker update becomes event-driven.

### Steps

**1. Enable Realtime on `telematics_gps_points`**
- Migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.telematics_gps_points;`

**2. Update `GoogleLiveTrackingMap.tsx`**
- Subscribe to `postgres_changes` on `telematics_gps_points` filtered by the current session's `telematics_id`
- On each `INSERT` event, append the new point to the trail and update the marker position immediately
- Keep the initial fetch on mount to load existing trail points
- Keep the 5-second poller trigger (for the edge function) but remove the 5-second trail re-fetch — new points arrive via realtime instead
- Optionally reduce the poller trigger to 3 seconds for slightly faster edge function kicks

**3. Fallback**
- If the realtime channel disconnects, fall back to polling as today (resilience)

### Files to change
- **Migration SQL** — enable realtime publication
- `src/components/instructor/GoogleLiveTrackingMap.tsx` — add realtime subscription, remove trail polling interval

### Expected Result
New GPS points appear on the map within ~1 second of being written to the database, instead of up to 5 seconds. Total end-to-end delay becomes device reporting interval (~5-10s) + poller latency (~3-5s) + ~instant DB-to-client push = **~8-15s**, down from **~10-20s**.

