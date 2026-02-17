

# Remove "Vehicle GPS Device" from Instructor Settings

## What Changes
Remove the "Vehicle GPS Device" settings tile from the instructor settings page. Since tracker assignment is now admin-only, instructors no longer need this section.

## Technical Details

### File: `src/pages/InstructorSettings.tsx`
- **Remove lines 1028-1067**: Delete the entire "Hardware GPS Tracking Section" `SettingsTile` block with id `gps-device`, which contains the "Device Setup" and "Start Tracking Session" buttons.
- The `Navigation` icon import may also be removable if no other usage exists (will verify).

No other files need changes -- this is a straightforward removal of one settings tile.

