Root cause: the tracking page still keeps the Radius device as the active session anchor. When Phone Tracker is selected, the app can still attach the lesson session to the Radius device, and the Radius poller then writes the Radius coordinates into the shared live-position/session tables. The map then reads those shared rows, so it can display Radius even though the UI says Phone Tracker.

Plan:

1. Make provider choice authoritative
- If `preferred_tracking_provider = 'phone'`, do not auto-switch back to Radius just because a Radius device is fresh.
- Only default to Radius when there is no explicit provider preference.
- Keep the Radius device discoverable for the dropdown, but do not let it override Phone Tracker.

2. Add/use a dedicated Phone Tracker session anchor
- Create or reuse one internal `gps_devices` row per instructor with `tracking_provider = 'phone'` and a clear name like `Phone Tracker`.
- When Phone Tracker is selected, set the page `device` state to this phone tracker row, not the Radius row.
- When Start Lesson is clicked in Phone mode, write `current_session_id/current_pupil_id` to the phone tracker row only.
- This prevents the Radius poller from treating the lesson as a Radius session.

3. Read phone coordinates from phone-only data
- Stop using shared `live_pupil_positions` as the instructor map source while Phone Tracker is selected.
- Read from the existing phone-only `phone_live_positions` table/RPC instead.
- Fall back only to the browser’s current GPS fix (`lastPhoneFix`) while waiting for the first streamed phone row.
- Never fall back to `gps_devices.last_latitude/last_longitude` in Phone mode.

4. Stream Phone Tracker fixes into the active lesson
- Pass the active phone session ID into `usePhoneTrackingStreamer`.
- Update the streamer so accepted phone GPS fixes:
  - update the phone-only live-position row,
  - insert phone points into `telematics_gps_points` for the active lesson route,
  - continue updating pupil live position only when appropriate, without being used as the instructor map source.

5. Stop Radius polling during Phone sessions
- The page should only invoke `radius-poller` when the active provider/device is Radius.
- Phone sessions should rely entirely on browser GPS updates.

6. Add a start safety gate for Phone Tracker
- If Phone Tracker is selected, Start Lesson should request location permission and wait for the first high-accuracy phone GPS fix.
- Until that fix arrives, the map should show “Waiting for phone GPS…” rather than showing Radius/stale coordinates.

7. Clean up UI labels
- Show `Phone Tracker` / `Phone GPS live` in the header and fullscreen source label when Phone mode is active.
- Hide or disable Radius device switching during an active Phone session, so the active source is unambiguous.

Technical changes expected:
- Update `src/pages/InstructorLiveSession.tsx` provider selection, session start/stop, `isConnected`, map props, and Radius poller guard.
- Update `src/hooks/usePhoneTrackingStreamer.ts` to accept/pass active `sessionId` and write phone-only/session GPS data.
- Add a small phone-only live-position hook or adapt the page to read `phone_live_positions` directly.
- Add a database migration/RPC to safely ensure one Phone Tracker `gps_devices` row per instructor without touching the existing Radius device or live data.

No reassignment of Charlotte/Kenneth/Richard data will be made. Existing Radius devices stay exactly where they are.