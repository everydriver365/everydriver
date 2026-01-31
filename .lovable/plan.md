
# Vehicle Movement Alerts - IMPLEMENTED ✅

## Overview
Intelligent vehicle security monitoring that detects unauthorized movement outside of scheduled lesson times. When a GPS-tracked vehicle moves while no lessons are scheduled, the instructor receives an immediate push notification.

## What Was Built

### Database Tables
- `vehicle_security_settings` - Per-vehicle security configuration (threshold, cooldown, ignition alerts)
- `vehicle_security_alerts` - Alert event logging with Realtime enabled

### Edge Function Updates
- `traccar-poller` - Extended with security checking logic:
  - Checks for active sessions and scheduled lessons
  - Detects movement above threshold when no lessons scheduled
  - Respects cooldown period to prevent spam
  - Sends push notifications via notify-instructor

- `notify-instructor` - Added "security_alert" notification type

### Frontend Components
- `useVehicleSecurity.ts` - Hook for managing security settings and alerts with Realtime subscription
- `VehicleSecurityCard.tsx` - Per-vehicle security toggle with configurable settings
- `SecurityAlertsTab.tsx` - Alert history with acknowledge/dismiss functionality
- Updated `InstructorVehicleHealth.tsx` - New "Security" tab with unread badge

## How It Works
1. `traccar-poller` receives GPS position from hardware device
2. If no active tracking session exists:
   - Checks if vehicle has security monitoring enabled
   - Verifies no scheduled lessons for instructor (with 15-min buffer)
   - If vehicle is moving above threshold, creates alert and sends push notification
3. Instructor sees alert in Security tab and can view on map or acknowledge

