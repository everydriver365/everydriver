I found the likely cause: the fullscreen map coordinates are now source-aware, but the location text under the speed display is still coming from `device.last_road_name`, which is Radius/device data. So when Phone Tracker is selected, the map marker can be based on the phone while the road/location label under the speed is still stale/wrong from the Radius unit.

Plan:

1. Add a source-aware road/location value in `InstructorLiveSession.tsx`
   - Use the existing map source values as the single source of truth.
   - When Radius is active, continue using the Radius/device road name.
   - When Phone Tracker is active, do not pass the Radius road name into the speed panel.

2. Let the fullscreen map report its phone-derived road label back to the parent
   - `SatNavLiveMap` already reverse-geocodes the displayed coordinates when `roadName` is missing.
   - I’ll expose that resolved `displayRoadName` via a callback prop, so the bottom speed panel can show the same location that the map is actually using.

3. Update the bottom speed display
   - Pass the source-aware road label into `FloatingSessionTimer` instead of `device.last_road_name`.
   - If Phone Tracker is selected and the phone road name is not ready yet, show “Locating road…” rather than the wrong Radius/device location.

4. Reset stale labels when switching source/session
   - Clear the phone-derived road label when leaving Phone Tracker, changing session, or changing coordinates enough that a fresh geocode is needed.
   - This prevents an old phone road name from sticking after switching to Radius, or vice versa.

5. Keep the existing source badge
   - The badge remains as “Source: Phone” / “Source: Radius” so it’s obvious which feed is active.

Technical details:

- Files to update:
  - `src/pages/InstructorLiveSession.tsx`
  - `src/components/instructor/tracking/SatNavLiveMap.tsx`

- Expected result:
  - Phone Tracker selected: marker, speed, last fix, and location label all come from the phone GPS path.
  - Radius selected: marker, speed, last fix, and location label all come from the Radius device path.
  - No more Radius/unit location showing under the speed display while Phone Tracker is selected.