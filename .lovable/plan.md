
Goal
- Make the app show the phone’s current (live) GPSgate location, instead of getting “stuck” on an old road, by switching the backend poller to the correct “latest status” endpoint and parsing it robustly.

What’s happening now (root cause)
- The poller currently tries `/users/{id}/position` first, but GPSgate is returning 404 (confirmed in logs).
- It then falls back to `/users/{id}/tracks?Date=...`, which can be historical and can lag (or be date-boundary dependent), so the app can keep showing an older point even though the tracker app UI is correct.

High-level fix
- Replace the non-existent `/position` call with the correct “latest status” call: `/users/{id}/status`.
- Make the parsing tolerant to GPSgate’s different response shapes (casing, nested objects, etc.).
- Keep `/tracks` as a fallback only, and improve fallback robustness (today + yesterday).
- Ensure “online/offline” logic doesn’t get falsely marked as live if we don’t actually have a new GPS fix.

Implementation steps (code changes)
1) Update the poller to use `/status` (instead of `/position`)
- File: `supabase/functions/gpsgate-poller/index.ts`
- In the “registered devices” loop (around the code you diffed at ~778+):
  - Replace:
    - `.../users/${gpsGateUserId}/position?...`
  - With:
    - `.../users/${gpsGateUserId}/status?...`
  - Keep cache-busting and no-cache headers:
    - `?_=${Date.now()}`
    - `Cache-Control: no-cache, no-store`
- Acceptance criteria:
  - Logs no longer show `/position ... 404`.
  - We see successful `/status` responses and extracted lat/lng change while the phone moves.

2) Handle `/status` response structure safely (so we always extract lat/lng/speed/time)
- The existing helper functions are good, but they currently assume certain field names.
- Extend the “normalization” helpers so they can decode typical `/status` payload variations:
  - Update `GPSGateTrackPoint` typing to include likely status-model field variants:
    - `Utc`, `utc`, `ServerUtc`, `serverUtc`
    - `Position` possibly containing `Lat/Lng` OR `Latitude/Longitude`
    - `Velocity` possibly containing `GroundSpeed/Heading` (capitalized)
    - `Variables` (capitalized) for battery/speed/accuracy if present
  - Update extractors:
    - `extractPosition()`:
      - Already reads `track.Position.Lat/Lng`; add support for:
        - `track.Position.Latitude / track.Position.Longitude`
        - `track.Position.latitude / track.Position.longitude`
    - `extractSpeed()`:
      - Add support for capitalized nested velocity:
        - `track.Velocity.GroundSpeed` (and similar casing)
      - Add support for `track.Variables.speed` (capitalized Variables)
    - `extractHeading()`:
      - Add support for `track.Velocity.heading/Heading`
    - `extractTime()`:
      - Add support for `track.Utc` / `track.ServerUtc` (capitalized)
    - `extractBattery()`:
      - Add support for `track.Variables.batteryLevel` (capitalized Variables)
- Acceptance criteria:
  - For a status response, we consistently get non-null lat/lng and a reasonable timestamp, without needing endpoint-specific one-off parsing.

3) Improve fallback logic (tracks) but treat it as “backup”
- Keep the `/tracks` fallback, but make it less fragile:
  - If “today” returns empty, try “yesterday” (like the instructor loop already does).
- Add a small log line indicating which source was used:
  - “Using /status” vs “Fallback to /tracks”
- Acceptance criteria:
  - Even if `/status` is temporarily unavailable, the app still shows *some* position via tracks.
  - In normal operation, `/status` is used and updates match the tracker app.

4) Prevent “fake live” (don’t mark active if we didn’t actually get a new fix)
Right now, the UI’s “active” indicator is derived from `gps_devices.last_seen_at` being within ~30 seconds (see `useInstructorLastPosition`).
We should keep that meaningful:
- If `/status` returns no usable time field:
  - Do NOT blindly set `trackTime = now` just to pass the “newer than last” check.
  - Instead:
    - Use a secondary freshness check:
      - If lat/lng is unchanged (or moved less than a few meters), treat as not-new and skip updating `last_seen_at`.
      - If lat/lng meaningfully changed, allow update and set `last_seen_at = now` (as a last resort) and store `last_gpsgate_track_time = now` so subsequent comparisons work.
- Acceptance criteria:
  - When the phone is stationary or not sending new fixes, the app doesn’t oscillate into “live” just because the poller ran.
  - When the phone moves, the app updates promptly.

5) Apply the same “use /status first” approach in the instructor-only loop (optional but recommended)
- There is a second loop: “Process instructors with GPSgate IDs (phone tracking)” (~1184+), currently using `/tracks`.
- Update it to also try `/status` first (same helper), then fallback to tracks.
- This closes gaps for instructors who only have “virtual devices”.
- Acceptance criteria:
  - Instructors tracked via phone-only linkage also show live position updates.

How we’ll verify (end-to-end)
- Trigger the poller (it runs on its schedule) and observe:
  - `gps_devices.last_latitude/last_longitude/last_road_name/last_seen_at` update in near real-time when the phone moves.
- Open the live map / instructor view and confirm:
  - The marker moves as you drive (no longer stuck on “Watkin Road”).
  - The road name updates to the current road.
  - The “active” indicator corresponds to genuine GPS updates.

Technical notes / guardrails
- We will not remove `/tracks`; it remains a safe fallback.
- We will keep logging concise (and avoid logging full payloads every cycle) to prevent noisy logs:
  - Prefer logging full status payload only when parsing fails or when fields are missing, and truncate output.

Expected outcome
- The app will match what the GPSgate tracker app shows (same phone, same signal) because we’ll be pulling the same “latest status” data source that’s intended for real-time display, rather than historical tracks.
