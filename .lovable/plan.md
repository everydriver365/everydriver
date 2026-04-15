
Goal: make the tracking experience truly Radius-only and remove the remaining Geotab code paths that still surface on the instructor app.

1. Fix the live tracking page selection logic
- Update `src/pages/InstructorLiveSession.tsx` so the initial device query only considers Radius devices.
- If `preferred_tracking_provider` is `geotab` or null, fall back to `"radius"` when Radius devices exist.
- Ensure both the initial picker and any device re-fetch after selection stay constrained to Radius devices only.

2. Remove Geotab from the tracking selector UI
- Update `src/components/instructor/tracking/DeviceSelectorDropdown.tsx` to query only `tracking_provider = "radius"` devices instead of loading all devices and relabeling Geotab as “GPS”.
- Keep the dropdown hidden when there is only one Radius device, and show no Geotab-labelled or Geotab-backed options at all.

3. Remove Geotab polling from live tracking
- Replace the `geotab-poller` trigger in `src/components/instructor/GoogleLiveTrackingMap.tsx` with `radius-poller`.
- Update `src/hooks/useVehicleHealth.ts` so adaptive polling only triggers Radius, not Geotab.
- This prevents deleted/legacy Geotab devices from being refreshed back into the UI.

4. Strip Geotab-only tabs from instructor-facing pages
- Remove Geotab imports and conditional tabs from `src/components/instructor/vehicle-health/LiveTelemetryTab.tsx` (`Sensors`, `Faults`, `Speeding` tabs and related content).
- Audit instructor pages already partially cleaned (`InstructorFleetDashboard`, `InstructorGPSSetup`, `InstructorLiveSession`) and remove leftover Geotab types/comments/fields like `geotab_device_id` where no longer used in the UI.

5. Remove Geotab routes and admin entry points
- Remove `/instructor/geotab` from `src/routes/instructorPortalRoutes.tsx` and delete `src/pages/InstructorGeotabHub.tsx`.
- Remove `AdminGeotabFleet` from `src/pages/AdminPortal.tsx` and delete `src/components/admin/AdminGeotabFleet.tsx` unless you want that admin page replaced with a generic Radius fleet page instead.

6. Delete Geotab-specific frontend files
- Delete `src/components/instructor/geotab/*`
- Delete Geotab hooks that are only used by those components:
  - `src/hooks/useGeotabDriverEvents.ts`
  - `src/hooks/useGeotabFaultData.ts`
  - `src/hooks/useGeotabFuelUsage.ts`
  - `src/hooks/useGeotabImpactEvents.ts`
  - `src/hooks/useGeotabStatusData.ts`
  - `src/hooks/useGeotabTrips.ts`
- Refactor any remaining dependent UI first so these deletions are clean.

7. Delete Geotab backend functions
- Remove these function folders and delete the deployed functions too:
  - `supabase/functions/geotab-behaviour-sync`
  - `supabase/functions/geotab-fault-data`
  - `supabase/functions/geotab-media-download`
  - `supabase/functions/geotab-poller`
  - `supabase/functions/geotab-status-data`
  - `supabase/functions/geotab-trips`
  - `supabase/functions/rork-geotab-proxy`
- Also review `supabase/functions/_shared` for Geotab-only helpers and remove any no-longer-used shared code.

8. Clean up database-facing references safely
- Keep existing historical Geotab tables/columns for now unless you explicitly want schema cleanup too.
- If desired later, do a separate migration pass to drop Geotab tables/policies/columns after verifying nothing else depends on them.
- Also normalize any instructor records with `preferred_tracking_provider = 'geotab'` to `radius` or `null` during implementation so stale preferences stop influencing selection.

Technical notes
- The direct cause of “I can still select both” is the tracking page still using broad `gps_devices` queries:
  - `InstructorLiveSession.tsx` fetches all active devices, then derives a provider from whatever exists.
  - `DeviceSelectorDropdown.tsx` fetches all devices with no provider filter.
- There are still hard Geotab runtime paths:
  - `GoogleLiveTrackingMap.tsx` invokes `geotab-poller`
  - `useVehicleHealth.ts` invokes both `geotab-poller` and `radius-poller`
  - `LiveTelemetryTab.tsx` hardcodes `const hasGeotab = true`
- There are also remaining route/admin files that keep Geotab alive in the bundle even if hidden.

Expected outcome
- On `/instructor/tracking`, only Radius devices can ever appear.
- No Geotab option, label, route, tab, or poller remains in the instructor app.
- Geotab-specific frontend files and backend functions are removed from the project, with tracking defaulting entirely to Radius.
