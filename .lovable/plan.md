

## Show Preferred Tracker Data on Home Page and Track Page

### Problem

The `TelematicsTile` on the instructor home page always picks `devices?.[0]` — the first device returned by the query — regardless of which tracker the instructor has selected as their preferred device. The same issue exists with `useVehicleHealth` which doesn't consider the `preferred_tracking_provider` setting stored on the `instructors` table.

### Fix

**1. Update `useVehicleHealth` hook** (`src/hooks/useVehicleHealth.ts`)
- Fetch the instructor's `preferred_tracking_provider` alongside the devices query
- Sort/filter the returned devices array so the preferred provider's device comes first
- Export a `preferredDevice` convenience field from the hook so consumers can use it directly

**2. Update `TelematicsTile`** (`src/components/instructor/TelematicsTile.tsx`)
- Instead of `devices?.[0]`, use the `preferredDevice` from the hook (or the first device matching the preferred provider)
- This ensures the home page tile shows data from the tracker the instructor selected in settings

**3. Update `LiveTelemetryTab`** (`src/components/instructor/vehicle-health/LiveTelemetryTab.tsx`)
- Default `selectedDeviceId` to the preferred device rather than `devices[0]`

### Files Changed

- `src/hooks/useVehicleHealth.ts` — fetch `preferred_tracking_provider`, sort devices so preferred comes first, export `preferredDevice`
- `src/components/instructor/TelematicsTile.tsx` — use `preferredDevice` instead of `devices?.[0]`
- `src/components/instructor/vehicle-health/LiveTelemetryTab.tsx` — default selection to preferred device

### Technical Details

In `useVehicleHealth`, after fetching devices, also fetch:
```sql
SELECT preferred_tracking_provider FROM instructors WHERE id = ?
```

Then sort the active devices array so devices matching the preferred provider appear first. Export both the sorted `devices` array and a `preferredDevice` (first device matching preferred provider, falling back to first device overall).

No database changes needed — the `preferred_tracking_provider` column and device selection logic already exist.

