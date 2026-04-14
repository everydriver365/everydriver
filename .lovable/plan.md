

## Restore tracker selection on the live tracking page

### Investigation
I reviewed the current code and the `DeviceSelectorDropdown` component is still present at line 882 of `InstructorLiveSession.tsx`. It renders for 1+ active devices and should be visible when no session is active.

However, there are two issues that could explain why it appears broken:

1. **The dropdown only appears when no session is active** — during a live session (fullscreen map mode), the entire non-session UI is skipped, so there's no way to switch trackers mid-session.
2. **The dropdown queries `is_active = true`** — if the user's devices aren't marked active, nothing shows.

### Changes

**`src/components/instructor/tracking/DeviceSelectorDropdown.tsx`**
- Remove the `is_active = true` filter so all devices for the instructor are shown (inactive ones can be visually dimmed)
- Ensure the dropdown renders even with a single device so the user always has confirmation of which tracker is selected

**`src/pages/InstructorLiveSession.tsx`**
- Add the `DeviceSelectorDropdown` to the **active session view** (lines 806-873) as a small floating selector in the top-left of the fullscreen map, so the user can switch trackers even during a session
- When switching device mid-session, update the device state and re-subscribe to the new device's data

### Technical details
- The floating selector during active sessions will be positioned `absolute top-4 left-4 z-30` with a compact style
- Switching devices mid-session will call the same `onDeviceChange` handler that resets refs and re-fetches device data
- The dropdown will show all devices (not just active provider) to match the unified selector behaviour established earlier
