

# Remove Legacy Mobile GPS Tracking Banner

## What's Changing
The "Mobile GPS Tracking" banner at the top of the Vehicle Health, Routes, and Mileage Tracker pages is a leftover from the old GPSgate mobile tracking system. Since the platform now uses Geotab hardware-only tracking, this banner is outdated and will be removed from all pages.

## Files to Update

| File | Change |
|------|--------|
| `src/pages/InstructorVehicleHealth.tsx` | Remove the MobileTrackingSettingsBanner import and usage |
| `src/pages/InstructorRoutes.tsx` | Remove the MobileTrackingSettingsBanner import and usage |
| `src/pages/InstructorMileageTracker.tsx` | Remove the MobileTrackingSettingsBanner import and usage |
| `src/components/instructor/MobileTrackingSettingsBanner.tsx` | Delete the file entirely |

No database changes needed -- the legacy `gpsgate_user_id` / `gpsgate_username` columns can stay in the database without causing issues.

