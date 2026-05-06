I found the likely cause.

Kenneth’s instructor profile is active as `Ken D`, and there is an active Radius tracker connected to that instructor:

- Tracker name: `Charlotte`
- Provider: `radius`
- Active: yes
- Last seen: 2026-05-06 08:18:43 UTC
- Last heartbeat: 2026-05-06 08:19:41 UTC

But his saved tracking preference is currently `phone`. The tracking page should still hydrate the Radius device in the background and let him switch to it, but the current code has a few brittle paths that can make the UI look like no hardware tracker exists.

Plan to fix:

1. Make tracker/provider loading more robust on `/instructor/tracking`
   - Fetch all of the instructor’s active `gps_devices` first, not only rows already filtered to `tracking_provider = 'radius'`.
   - Pick the best active Radius device from that result when available.
   - Keep Kenneth’s saved provider preference respected, but never hide the available Radius tracker just because the preferred provider is `phone`.

2. Improve the Radius option in the tracker dropdown
   - Ensure the dropdown detects active Radius devices reliably.
   - If a Radius device exists, show/select `Radius tracker` rather than `Radius tracker (no device linked)`.
   - When switching from Phone to Radius, immediately load the selected Radius device into page state.

3. Fix helper hooks that only know about Radius
   - Update `useActiveTrackingProvider` so it recognises both `phone` and `radius` as valid providers.
   - Keep Radius as the hardware provider, but do not let the hook return `null` just because the saved preference is `phone`.

4. Add a clearer tracker status in the UI
   - If a Radius tracker is linked but the active choice is Phone, the tracker tile should make that clear.
   - If Radius is selected but stale/offline, show that as a connection freshness issue, not “no tracker available”.

5. Verify with Kenneth’s live data
   - Confirm the page can see the active tracker row for instructor `Ken D`.
   - Confirm the provider dropdown can switch between Phone tracking and Radius tracker.
   - Confirm the Start button remains usable for Phone mode, and Radius mode continues to require a real tracker connection.