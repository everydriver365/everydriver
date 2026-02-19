

# Arrow Marker, Auto-Follow, and Screen Wake Lock

## What Will Change

### 1. Directional Arrow Marker
Replace the plain circle marker with a forward-pointing arrow that rotates to match the vehicle's heading direction.

- Change the marker icon from `SymbolPath.CIRCLE` to `SymbolPath.FORWARD_CLOSED_ARROW`
- Add `rotation` property set to the device's `last_heading` value
- Scale up slightly for better visibility on mobile
- Keep the existing colour coding (green = connected, red = overspeed, grey = offline)

### 2. Map Auto-Follows the Car
The map currently stops following after the user drags it. Improve this so:

- Auto-follow resets after 10 seconds of no interaction (instead of requiring a manual button tap)
- The "Center" button remains for instant re-centering

### 3. Screen Stays On (Wake Lock)
Add a Wake Lock request directly inside `GoogleLiveTrackingMap` so the screen stays on whenever the map is visible -- not just during active sessions. This covers the case where an instructor is watching tracking without starting a formal session.

## Technical Details

### File: `src/components/instructor/GoogleLiveTrackingMap.tsx`

**Arrow Marker (Effect #3, ~line 227)**
- Add `last_heading` to the `DeviceRow` type (it's already in the database, just not selected)
- Update the device query (Effect #1, ~line 141) to include `last_heading` in the select
- Change marker icon from:
  ```text
  path: SymbolPath.CIRCLE, scale: 8
  ```
  to:
  ```text
  path: SymbolPath.FORWARD_CLOSED_ARROW, scale: 6, rotation: device.last_heading
  ```

**Auto-Follow Timer**
- When `userDragged` is set to `true`, start a 10-second timeout
- After 10 seconds, reset `userDragged` to `false` so the map resumes following
- Clear the timeout if the user drags again or unmounts

**Wake Lock**
- Add a `useEffect` that requests `navigator.wakeLock.request('screen')` when the component mounts
- Re-acquire on `visibilitychange` (when user switches back to the tab)
- Release on unmount
- This is independent of session state -- the map being visible is enough reason to keep the screen on

### No New Files or Backend Changes
All changes are in `GoogleLiveTrackingMap.tsx` only. No database changes, no new dependencies.
