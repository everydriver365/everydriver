## Problem

Kenneth Dufosse (`Ken D`) has an active Radius tracker (`Charlotte`, device `0cd17…a8d4`) linked to his instructor record, but on `/instructor/tracking` the **Radius tracker** entry in the tracker dropdown shows as "(no device linked)" and is disabled.

Two issues are at play:

1. `TrackingProviderDropdown` only enables Radius when its own `gps_devices` lookup returns ≥1 row. The lookup only filters on `tracking_provider = 'radius'` and ignores `is_active`, but it relies on RLS that uses an inline `instructors` subquery instead of the project-standard `get_instructor_id_for_user(auth.uid())` helper. In some auth contexts (school portal, slow auth hydration) it returns nothing, so the option stays disabled even when the device exists.
2. `InstructorLiveSession.fetchData` mirrors the same query and treats `preferred_tracking_provider = 'phone'` as "force phone, never load device". Because Kenneth's preference is `phone`, even if Radius were enabled the device wouldn't be hydrated until he switched.

## Fix

### 1. `src/components/instructor/tracking/TrackingProviderDropdown.tsx`
- Replace the existence check with a query that:
  - Drops the `tracking_provider = 'radius'` filter and instead pulls all of the instructor's devices, then checks client-side for any row with `tracking_provider = 'radius'` AND `is_active = true`.
  - Uses `public.get_instructor_id_for_user(auth.uid())` style identity (call the existing helper via `.rpc('get_instructor_id_for_user', …)`) as a fallback if the direct query returns 0 rows, so the answer no longer depends on whichever RLS subquery happens to fire.
- Keep the option enabled (not disabled) whenever a Radius device row exists, regardless of `preferred_tracking_provider`.

### 2. `src/pages/InstructorLiveSession.tsx` (`fetchData`, ~lines 363–410)
- Always load the Radius device row when one exists for the instructor, even if `preferred_tracking_provider === 'phone'`. Store it in `device` state so the dropdown's "switch to Radius" path has a hydrated device immediately.
- Keep `activeProvider` honouring the saved preference (`'phone'` stays the default), but no longer skip device hydration on that branch.

### 3. Auto-prefer Radius when available (small UX win)
- In `fetchData`, if `preferred_tracking_provider` is `null` (never set) **and** an active Radius device is found, set `activeProvider` to `'radius'` and persist that as the new preference. Phone remains the default only when there is no hardware tracker.

### Verification
- For Kenneth (`c9843b58-…ea`) the dropdown should now show **Radius tracker** as selectable, with `Charlotte` hydrated as the device and live telemetry feeding the map.
- For Richard (no Radius device) the dropdown should continue to show "(no device linked)" and stay on Phone.
- No DB migrations or schema changes required.
