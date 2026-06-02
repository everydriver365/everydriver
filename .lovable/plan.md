## Goal
Display the linked Geotab device name on the mobile Vehicle Health tile so instructors can see which unit is connected.

## What to change
**File:** `src/components/instructor/VehicleHealthGeotabTile.tsx`
- The hook `useGeotabHealth` already returns `deviceName: string | null` (read from `gps_devices.device_name`).
- Render the device name on the tile when `data.deviceName` is present.
  - Placement: under the eyebrow "Vehicle health" label, as a small secondary label.
  - Style: 10px, weight 600, muted color (e.g. `#8a93a4` or `#6B7280`), aligned with the eyebrow row.
- Keep existing behaviour: tile still navigates to `/instructor/vehicle-health?tab=geotab` on tap. Video pill remains unchanged.
- If `deviceName` is null, show nothing (no placeholder).

## Out of scope
- No backend or hook changes required (data already fetched).
- No desktop tile changes (mobile-only tile).
- No new icons or imagery.

## Testing
- Verify the tile still self-gates (returns null when `hasGeotab` is false).
- Verify device name appears when `deviceName` is populated.
- Verify tile remains tappable and layout does not break with long device names (truncate with ellipsis if needed).