
# Add GPSgate User ID to Instructor Profile Settings

## Overview
Add a new "GPS Tracking" tab to the existing InstructorDetailsEditor component, allowing instructors to configure their GPSgate User ID directly in their profile settings. This links the instructor's account to their GPSgate Tracker app.

## Database Changes

Add two new columns to the `instructors` table:

| Column | Type | Purpose |
|--------|------|---------|
| `gpsgate_user_id` | INTEGER | The GPSgate User ID from the instructor's tracker |
| `gpsgate_username` | TEXT | The GPSgate username (for display reference) |

## Frontend Changes

### Update InstructorDetailsEditor Component

Add a 4th tab called "GPS Tracking" to the existing tabbed interface:

**Current tabs:**
- Vehicle
- Qualifications  
- Social Links

**Updated tabs:**
- Vehicle
- Qualifications
- Social Links
- GPS Tracking (new)

### GPS Tracking Tab Content

The new tab will include:

1. **GPSgate Username field**
   - Text input for the instructor's GPSgate username
   - Helper text: "Your GPSgate Tracker app username"

2. **GPSgate User ID field**
   - Numeric input for the User ID (optional - can be auto-discovered)
   - Helper text: "Leave blank to auto-discover from username"

3. **Connection Status indicator**
   - Shows if the instructor's tracker is currently online
   - Displays last position timestamp if available
   - Uses the existing useGPSConnectionStatus hook logic

4. **Test Connection button**
   - Triggers a poll to verify the credentials work
   - Shows success/error feedback

### Update Edge Function

Modify the `gpsgate-poller` to also check the `instructors` table for GPSgate mappings:

```text
Current flow:
GPSgate API -> Match to traccar_devices -> Update positions

New flow:
GPSgate API -> Match to instructors (by gpsgate_user_id)
           -> Match to traccar_devices (existing)
           -> Update positions accordingly
```

This allows instructors to be tracked directly without needing a separate device registration.

## Implementation Steps

### Phase 1: Database Migration
1. Add `gpsgate_user_id` (INTEGER) column to instructors table
2. Add `gpsgate_username` (TEXT) column to instructors table

### Phase 2: Update InstructorDetailsEditor
1. Add GPS tracking fields to the InstructorDetails interface
2. Update the SELECT query to include new fields
3. Add new "GPS Tracking" tab with input fields
4. Add connection status display using useGPSConnectionStatus
5. Add Save button for GPS settings

### Phase 3: Update Edge Function
1. Modify gpsgate-poller to also query instructors table for GPSgate mappings
2. When a match is found via instructor, update that instructor's last_seen_at or a dedicated position field
3. Continue supporting existing device-based tracking for vehicles

## UI Preview

```text
+----------------------------------------------------------+
| Vehicle | Qualifications | Social Links | GPS Tracking   |
+----------------------------------------------------------+
|                                                          |
|  GPSgate Username                                        |
|  [_____________________________]                         |
|  Your GPSgate Tracker app username                       |
|                                                          |
|  GPSgate User ID (optional)                              |
|  [___________]                                           |
|  Leave blank to auto-discover from username              |
|                                                          |
|  +----------------------------------------------------+  |
|  |  Connection Status                                 |  |
|  |  [●] Connected - Last update: 2 minutes ago        |  |
|  +----------------------------------------------------+  |
|                                                          |
|  [        Test Connection        ]                       |
|                                                          |
|  [       Save GPS Settings       ]                       |
|                                                          |
+----------------------------------------------------------+
```

## Technical Notes

- The GPSgate User ID in the instructors table works independently from the traccar_devices table
- Instructors using the iOS GPSgate Tracker app on their phone will be matched via this setting
- Vehicle hardware trackers (OBD-II devices) continue using the traccar_devices table
- Both can coexist - an instructor can have their phone tracked AND a vehicle tracker
