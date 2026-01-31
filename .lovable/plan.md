
# Vehicle Movement Alerts for After-Hours Monitoring

## Overview
This feature adds intelligent vehicle security monitoring that detects unauthorized movement outside of scheduled lesson times. When a GPS-tracked vehicle moves while no lessons are scheduled, the instructor receives an immediate push notification alerting them to potential theft or unauthorized use.

## How It Works

The system checks three conditions before triggering an alert:
1. **No active tracking session** - The device isn't in use for a lesson
2. **No scheduled lessons** - No lessons are planned for this vehicle/instructor at the current time
3. **Vehicle is moving** - Speed exceeds a configurable threshold (default: 5 km/h) or position changes significantly

When all three conditions are met, the instructor receives a push notification with the vehicle's current location and a link to track it live.

---

## Database Schema

### New Tables

**vehicle_security_settings**
Stores per-vehicle security preferences:
- `id` - Primary key
- `vehicle_id` - Links to instructor_vehicles
- `instructor_id` - Links to instructor
- `security_enabled` - Master toggle for alerts
- `movement_threshold_kmh` - Minimum speed to trigger alert (default: 5)
- `alert_cooldown_minutes` - Time between repeat alerts (default: 30)
- `notify_on_ignition` - Alert when ignition turns on outside lessons
- `created_at` / `updated_at` - Timestamps

**vehicle_security_alerts**
Logs all security events:
- `id` - Primary key
- `vehicle_id` - Which vehicle triggered the alert
- `instructor_id` - Owner of the vehicle
- `device_id` - Which GPS device detected movement
- `alert_type` - Type: `unexpected_movement`, `ignition_on`, `geofence_exit`
- `latitude` / `longitude` - Where the alert occurred
- `speed_kmh` - Speed at time of alert
- `triggered_at` - When the alert fired
- `notification_sent` - Whether push notification was delivered
- `acknowledged` - Whether instructor dismissed the alert
- `acknowledged_at` - When dismissed

### Row Level Security
- Instructors can only view/update their own security settings and alerts
- RLS policies will be applied to both new tables

---

## Edge Function Enhancement

The `traccar-poller` function will be extended with security checking logic:

### Detection Flow
```text
1. Poll Traccar for new positions
2. For each device with movement detected:
   a. Check if device has an active session → SKIP if yes
   b. Look up linked vehicle's security settings → SKIP if disabled
   c. Check for any scheduled lessons NOW for this instructor
   d. If vehicle is moving AND no lessons scheduled:
      - Check cooldown period (avoid spam)
      - Log security alert to database
      - Send push notification to instructor
```

### Lesson Time Check Logic
The function will query `scheduled_lessons` to determine if any lesson is in progress:
- Finds lessons where current time falls within `start_time` to `start_time + duration_minutes`
- Considers a 15-minute buffer before/after lessons (driving to/from pickup)
- If the instructor has ANY active lesson, movement alerts are suppressed

---

## User Interface

### Security Settings Card
Located in the Vehicle Health dashboard under a new "Security" section:

**Per-Vehicle Toggle**
- Enable/disable security monitoring for each vehicle
- Set movement threshold (slider: 3-15 km/h)
- Configure alert cooldown (15/30/60 minutes)
- Toggle ignition-on alerts

### Security Alerts Tab
New tab in Vehicle Health showing recent security events:
- List of recent alerts with timestamps and locations
- Acknowledge/dismiss buttons
- "View on Map" link to Find My Car page
- Filter by alert type and date range

### Quick Toggle
- Global security status indicator on the Live tab
- One-tap enable/disable for all vehicles

---

## Push Notification Format

When a security alert triggers, the instructor receives:

**Title:** "🚨 Vehicle Alert"
**Body:** "{Registration} is moving at {speed} km/h - no lesson scheduled"
**Actions:**
- Open → Takes to Find My Car page with vehicle highlighted
- Dismiss → Acknowledges the alert

---

## Implementation Files

### New Files
- `src/components/instructor/vehicle-health/VehicleSecurityCard.tsx` - Per-vehicle security toggle
- `src/components/instructor/vehicle-health/SecurityAlertsTab.tsx` - Alert history list
- `src/hooks/useVehicleSecurity.ts` - React hook for security settings and alerts

### Modified Files
- `supabase/functions/traccar-poller/index.ts` - Add security check logic after position processing
- `supabase/functions/notify-instructor/index.ts` - Add new notification type for security alerts
- `src/pages/InstructorVehicleHealth.tsx` - Add Security tab and integrate new components
- `src/hooks/useVehicleHealth.ts` - Include security settings in vehicle data

---

## Technical Details

### Cooldown Logic
To prevent notification spam when a vehicle is being moved legitimately:
- After an alert fires, no new alerts for that vehicle for X minutes
- Cooldown tracked by comparing `triggered_at` of most recent alert
- Different cooldowns for different alert types (movement vs ignition)

### Performance Considerations
- Security checks run only when no active session exists (minimal overhead for normal use)
- Scheduled lessons query is optimized with date/time indexing
- Alert cooldown check prevents redundant database writes

### Edge Cases Handled
- **Tow truck scenario**: Continuous movement without ignition triggers repeated alerts (at cooldown intervals)
- **GPS drift**: Movement threshold filters out minor GPS jitter
- **Lesson running late**: 15-minute post-lesson buffer prevents false alerts
- **Multiple vehicles**: Each vehicle has independent security settings

---

## Database Migration Summary

Creates 2 new tables with RLS policies:
1. `vehicle_security_settings` - Per-vehicle configuration
2. `vehicle_security_alerts` - Event logging

Enables Realtime on `vehicle_security_alerts` for live alert updates in the UI.
