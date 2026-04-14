

## Diagnosis: Why Charlotte's Tracker is Delayed and Missing from Recent Trips

### Root Causes Found

**1. No scheduled polling** — The `radius-poller` has no cron job. It only runs when manually invoked. The Geotab poller runs every 5 seconds via cron, but Radius has nothing. This is why data is always delayed.

**2. GPS points lost because session started after poller ran** — The poller ran at 11:44-11:46 and consumed export queue items from 11:09-11:36. But the current session (`6040cefa`) was created at 11:47:03. So all those GPS points were written to `gps_devices` but NOT to `telematics_gps_points` because `current_session_id` wasn't set yet. The export queue is destructive — once consumed, those points are gone.

**3. Recent Trips shows nothing useful** — The `RecentSessionsList` filters for `ended_at IS NOT NULL`. Previous sessions for this instructor either have 0 km distance or wildly wrong values (17,884 km). The current active session has 0 GPS points and 0 distance.

**4. "Offline" status** — The tracking page shows offline because `last_seen_at` is 11:36 (10+ mins ago), and the `useInstructorLastPosition` hook considers anything older than 60 seconds as inactive.

### Plan (4 changes)

**Step 1: Add cron schedule for radius-poller**
Create a `pg_cron` job to invoke `radius-poller` every 30 seconds (matching the export stream's delivery rate). This ensures data flows continuously without manual invocation.

**Step 2: Auto-create session on first telemetry if ignition is on**
In the radius-poller, when a device has no `current_session_id` but ignition is ON and we receive valid GPS data — automatically create a `lesson_telematics` session and set `current_session_id` on the device. This prevents the "session created too late" problem.

**Step 3: Auto-end session when ignition turns off**
When the poller sees ignition OFF and there IS an active session, automatically set `ended_at` on the session and clear `current_session_id`. This ensures sessions appear in Recent Trips.

**Step 4: Fix distance calculation**
The current speed-based distance estimate (`speedKmh * 10 / 3600`) assumes 10-second intervals but the export stream delivers at ~2-3 minute intervals. This produced the 17,884 km values. Fix by calculating actual time delta between the current and previous GPS point.

### Technical Details

- The cron job will be created via a database migration using `pg_cron` and `pg_net` to call the edge function URL
- Session auto-creation will insert into `lesson_telematics` with `instructor_id` from the device, `pupil_id` from `current_pupil_id` (if set), and `started_at = now()`
- Session auto-end will update `ended_at` and trigger the existing `auto_log_mileage` trigger
- Distance fix: store `recorded_at` of previous point and calculate `(speed * timeDeltaHours)` instead of assuming 10s

