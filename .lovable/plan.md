

## Plan: Remove Redundant Trackers & Show Active Provider in Setup

### Problem
Instructors can have multiple tracking providers registered (e.g. Geotab + Radius + GPSgate), but only one is actually in use. The mobile app shows components for all providers — the `MobileTrackingSettingsBanner` (GPSgate-specific), `TrackerSelectorTile` (shows all devices), and the GPS Setup page lists all devices without indicating which provider is active.

### What changes

**1. Determine the "active provider" for each instructor**

The `gps_devices` table has a `tracking_provider` column. We pick the active provider by priority: `geotab` > `quartix` > `radius` > `gpsgate` > `null` (manual). The device with the highest-priority provider that has `is_active = true` is the primary tracker.

**2. `TrackerSelectorTile.tsx` — Only show devices from the active provider**
- Filter the device query by `tracking_provider` matching the instructor's active provider
- This prevents showing Radius devices when Geotab is connected

**3. `MobileTrackingSettingsBanner.tsx` — Hide when GPSgate is not the active provider**
- This component is GPSgate-specific (checks `gpsgate_user_id`)
- Add a check: query the instructor's devices, if any device has `tracking_provider = 'geotab'` or `'quartix'`, don't render this banner
- Currently shown on: Live Session, Routes, Vehicle Health pages

**4. `InstructorLiveSession.tsx` — Fetch only the active provider's device**
- Currently fetches the first active device with no provider filter
- Add `.eq("tracking_provider", activeProvider)` or order by provider priority so the Geotab device is selected first

**5. `InstructorGPSSetup.tsx` — Show active provider badge and filter device list**
- Add a "Connected Tracker" card at the top showing which provider is active (e.g. "Geotab" with a green badge)
- Only show devices for the active provider in the device list
- Add a small note: "Other tracking providers have been disabled. Contact admin to change."
- Replace the generic `HardwareTrackerSetup` accordion with provider-specific info

**6. `InstructorRoutes.tsx` — Hide GPSgate trip tab when not using GPSgate**
- The "GPS" tab (`gpsgate` tab) shows GPSgate-specific trip data
- Hide it when the instructor's active provider is not GPSgate

### Files changed

| File | Change |
|------|--------|
| `src/components/instructor/tracking/TrackerSelectorTile.tsx` | Filter devices by active provider |
| `src/components/instructor/MobileTrackingSettingsBanner.tsx` | Hide when Geotab/Quartix is active |
| `src/pages/InstructorLiveSession.tsx` | Prioritise active provider device |
| `src/pages/InstructorGPSSetup.tsx` | Show active provider badge, filter devices |
| `src/pages/InstructorRoutes.tsx` | Hide GPSgate tab when not relevant |

### Logic for determining active provider

```text
1. Query gps_devices WHERE instructor_id = X AND is_active = true
2. If any has tracking_provider = 'geotab' → active = 'geotab'
3. Else if 'quartix' → active = 'quartix'  
4. Else if 'radius' → active = 'radius'
5. Else if gpsgate_user_id is set → active = 'gpsgate'
6. Else → active = null (manual/phone tracking)
```

This is a utility function shared across components.

