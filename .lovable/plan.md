

## Plan: Remove Quartix, GPSgate, Traccar & Damoov — Keep Only Geotab + Radius

### Scope

Remove all code, edge functions, and references to **Quartix**, **GPSgate**, **Traccar**, and **Damoov**. Only **Geotab** and **Radius** remain as supported tracking providers.

### Files to DELETE

| File | Reason |
|------|--------|
| `supabase/functions/quartix-trips/index.ts` | Quartix edge function |
| `supabase/functions/quartix-route/index.ts` | Quartix edge function |
| `src/hooks/useGPSgateTrips.ts` | GPSgate trips hook |
| `src/components/instructor/GPSgateTripsTabContent.tsx` | GPSgate trips UI |
| `src/components/instructor/GPSgateTripHistory.tsx` | GPSgate trip history UI |
| `src/components/instructor/MobileTrackingSettingsBanner.tsx` | GPSgate-specific banner (checks `gpsgate_user_id`) |
| `src/components/instructor/HardwareTrackerSetup.tsx` | Generic setup referencing Quartix |

### Files to EDIT

**`src/hooks/useActiveTrackingProvider.ts`**
- Remove `"quartix"` and `"gpsgate"` from `TrackingProvider` type and `PROVIDER_PRIORITY`
- Remove the `gpsgate_user_id` fallback check
- Type becomes `"geotab" | "radius" | null`, priority: `["geotab", "radius"]`

**`src/pages/InstructorRoutes.tsx`**
- Remove imports of `GPSgateTripHistory`, `GPSgateTripsTabContent`, `MobileTrackingSettingsBanner`
- Remove the "gpsgate" tab from `TabsList` and its conditional rendering
- Remove `activeProvider` checks for "gpsgate"
- Simplify tab grid columns

**`src/pages/InstructorLiveSession.tsx`**
- Remove `"quartix"` and `"gpsgate"` from the `priorityOrder` array
- Priority becomes `["geotab", "radius"]`

**`src/pages/InstructorGPSSetup.tsx`**
- Remove `HardwareTrackerSetup` import and component
- Remove any Quartix/GPSgate-specific UI or provider badge references
- Keep Geotab and Radius device management

**`src/components/instructor/tracking/TrackerSelectorTile.tsx`**
- No changes needed (already filters by `activeProvider`)

**`src/components/instructor/TrackingDebugPanel.tsx`**
- Remove `damoovStatus` from `DebugInfo` interface

**`src/components/instructor/vehicle-health/EnhancedDeviceStatusCard.tsx`**
- Remove `gpsgate_odometer_m` fallback in daily mileage calculation

**`src/hooks/useVehicleHealth.ts`**
- Remove `gpsgate_odometer_m`, `gpsgate_engine_hours_s` from select query and interface

**`src/pages/InstructorDocumentTemplates.tsx`**
- Update default template from Quartix-specific content to generic OBD tracker setup guide

**`src/routes/instructorPortalRoutes.tsx`**
- Remove `/instructor/traccar` route alias (keep `/instructor/live` and `/instructor/tracking`)
- Remove `/instructor/settings/traccar` route alias

### Edge functions to delete via tool
- `quartix-trips`
- `quartix-route`

### No database migration needed
The `gps_devices` table columns (`quartix_vehicle_id`, `quartix_driver_id`, `last_traccar_*`, etc.) and traccar/damoov tables can remain in the DB without harm — they're simply unused. Dropping columns/tables risks breaking things if any data references them.

### Summary
~7 files deleted, ~9 files edited, 2 edge functions removed. The app will only show Geotab and Radius as tracking options everywhere.

