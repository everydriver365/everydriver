<final-text>Root cause summary

- The Continue button currently does nothing because `src/pages/InstructorGPSSetup.tsx` passes empty callbacks to `PreFlightChecks`:
  - `onAllPassed={() => {}}`
  - `onSkip={() => {}}`
- The GPS setup page has the device creation logic (`deviceId`, `deviceName`, `createDevice`) but the actual registration form is missing from the rendered UI, so there is no way to add/connect a tracker from that page.
- The tracking page is also using the wrong condition for “device configured”. In `src/pages/InstructorLiveSession.tsx` it only loads `gps_devices` where `is_active = true`, but the current network data shows Charlotte already exists for this instructor and has recent GPS/heartbeat data while `is_active` is `false`. That makes the page incorrectly fall back to “No Device Configured”.

Implementation plan

1. Fix the GPS setup page interaction
- Restore the missing device registration section in `src/pages/InstructorGPSSetup.tsx` using the existing state and `createDevice()` handler.
- Add the expected inputs and CTA so the user can actually register a Radius device from this screen.

2. Make the Pre-Flight Continue button do something useful
- Replace the no-op callbacks with real handlers.
- If no device exists, Continue should scroll/focus to the registration form.
- If a device already exists, Continue should route back to `/instructor/tracking`.

3. Fix the tracker page device lookup
- Update `src/pages/InstructorLiveSession.tsx` so it no longer requires `is_active = true` just to consider a device “configured”.
- Load the instructor’s Radius devices, choose the most recently seen one, and keep using timestamp/heartbeat/ignition logic to decide whether it is connected, parked, recent, or offline.

4. Align provider detection
- Update `src/hooks/useActiveTrackingProvider.ts` so it does not hide the active Radius provider just because `is_active` is false on an otherwise valid device row.
- This keeps GPS setup, tracking, and fleet views consistent.

Technical details

- `src/pages/InstructorGPSSetup.tsx`
  - Re-add UI for `deviceId`, `deviceName`, and the register button.
  - Wire `PreFlightChecks` callbacks to real handlers.
- `src/pages/InstructorLiveSession.tsx`
  - Remove the `.eq("is_active", true)` gate from the initial `gps_devices` query.
  - Treat an existing device row as configured; treat freshness separately.
- `src/hooks/useActiveTrackingProvider.ts`
  - Stop depending only on `is_active` for provider selection.

Verification

- Open `/instructor/settings/gps` and confirm Continue now advances the flow.
- Register or select the existing tracker and return to `/instructor/tracking`.
- Confirm Charlotte shows on the tracking page instead of the “No Device Configured” empty state.
- Confirm stale devices still appear as offline/parked rather than disappearing.
- Test end to end: GPS setup → tracking page → fleet map.</final-text>