

## Duplicating Quartix Data Screens — COMPLETE

All features from the original plan have been implemented.

### Coverage

```text
+-------------------------------+------------------+-----------------------------------+
| Quartix Screen                | Status           | Your App Equivalent               |
+-------------------------------+------------------+-----------------------------------+
| Live Tracking Map             | BUILT            | LiveTrackingMap + GlanceableMode  |
| Route Map / Trip Replay       | BUILT            | Trip Replay with speed overlay    |
| Tracking Log (Trip History)   | BUILT            | GPSgateTripHistory                |
| Driving Style Scores          | BUILT            | TripCard scorecard + QuartixCard  |
| Driver Timesheets             | BUILT            | DriverTimesheets tab              |
| Pupil Leaderboard             | BUILT            | PupilDrivingLeaderboard           |
| Speed / Overspeeding          | BUILT            | Trip cards + replay speed overlay |
| Max Speed per Trip            | BUILT            | Shown in trip card stats          |
| Idle Time                     | BUILT            | Shown in trip cards + timesheets  |
| Fleet Management Dashboard    | BUILT            | FleetDashboard at /fleet-dashboard|
| Usage Profile / Utilisation   | BUILT            | UsageAnalytics component          |
| Real-Time Fleet Status        | BUILT            | FleetDashboard status pie + list  |
| Business/Private Mileage Mode | BUILT            | mileage_logs trip_type + hook     |
| Route Heatmap                 | BUILT            | RouteHeatmap with leaflet.heat    |
| Geofence Alerts               | BUILT            | GeofenceEditor + GeofenceAlerts   |
| Unauthorised Movement Alerts  | BUILT            | UnauthorisedMovementAlerts        |
| Scheduled Email Reports       | BUILT            | ScheduledReportsSettings          |
+-------------------------------+------------------+-----------------------------------+
```

### Architecture

**New database tables:** `geofences`, `geofence_alerts`, `movement_alerts`, `scheduled_reports`
**Modified tables:** `instructor_tracking_config` (added working_hours_start, working_hours_end, working_days)
**Updated edge function:** `quartix-poller` (geofence proximity check + after-hours movement detection)
**New route:** `/instructor/fleet-dashboard` with 6 tabs (Overview, Analytics, Heatmap, Geofences, Alerts, Reports)
