

## Duplicating Quartix Data Screens

Based on the Quartix 2025 platform walkthrough, here is a comparison of every major Quartix screen and what your app already has, followed by a plan to fill the gaps.

### Current Coverage

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
+-------------------------------+------------------+-----------------------------------+
| Route Heatmap                 | NOT BUILT        | --                                |
| Geofence Alerts               | NOT BUILT        | --                                |
| Unauthorised Movement Alerts  | NOT BUILT        | --                                |
| Scheduled Email Reports       | NOT BUILT        | --                                |
| Incident / Inspection Records | NOT BUILT        | --                                |
| Custom Locations / Geofences  | NOT BUILT        | FavouriteLocations exists (basic) |
+-------------------------------+------------------+-----------------------------------+
```

### What Needs Building (7 New Screens/Features)

#### 1. Fleet Management Dashboard
A new "Vehicle Intelligence" landing page at `/instructor/fleet-dashboard` with customisable widget cards:
- **Usage Profile** -- bar chart of daily mileage over the past week/month
- **Real-Time Status** -- pie chart showing Moving / Idle / Parked counts
- **Vehicles Off-Site** -- list of vehicles not at their overnight location
- **Daily Utilisation Target** -- gauge showing % of fleet in use vs target
- Data source: `gps_devices` table (live data) + `driver_timesheets` (historical)

#### 2. Route Heatmap
A Leaflet-based heatmap overlay showing most-travelled roads over a selected period:
- Uses the existing `leaflet.heat` dependency (already installed)
- Pulls GPS points from `quartix-route` edge function for multiple days
- Date range selector (7d / 14d / 30d)
- Helps identify repeated routes and coverage patterns
- New component: `RouteHeatmap.tsx`

#### 3. Geofence Alerts
Allow instructors to define geographic boundaries and get alerts:
- New database table: `geofences` (instructor_id, name, lat, lng, radius_m, alert_on_enter, alert_on_exit, active_hours)
- New database table: `geofence_alerts` (geofence_id, device_id, alert_type, triggered_at, lat, lng)
- Check logic added to `quartix-poller` -- on each live position update, compare against active geofences
- UI: map-based geofence editor (draw circle on map) + alerts list
- New components: `GeofenceEditor.tsx`, `GeofenceAlertsList.tsx`

#### 4. Unauthorised Movement Alerts
Detect vehicle movement outside configured working hours:
- New database table: `movement_alerts` (device_id, instructor_id, detected_at, lat, lng, speed_kmh, road_name)
- New field on `instructor_tracking_config`: `working_hours_start`, `working_hours_end`, `working_days`
- Check logic in `quartix-poller` -- if ignition ON or speed > 0 outside working hours, insert alert
- UI: alert cards with map preview showing where the movement was detected
- New component: `UnauthorisedMovementAlerts.tsx`

#### 5. Scheduled Email Reports
Allow instructors to schedule weekly/monthly PDF or CSV reports:
- New database table: `scheduled_reports` (instructor_id, report_type, frequency, email, last_sent_at, config)
- New edge function: `send-scheduled-report` -- generates and emails report data
- Report types: Weekly Mileage Summary, Driving Style Scores, Timesheet, Trip Log
- UI: settings panel to configure which reports to receive and when
- New component: `ScheduledReportsSettings.tsx`

#### 6. Business/Private Mileage Toggle (App-Side)
Add a driver-facing toggle to mark trips as business or private:
- New column on trip/mileage data: `trip_classification` (business/private)
- Update `quartix-trips` to accept classification from the app
- Driver can toggle before/after trips in the tracking view
- Feeds into existing mileage tracker and tax reports
- Update existing `GPSgateTripHistory.tsx` with classification badges

#### 7. Usage Profile and Utilisation Charts
Weekly and monthly usage analytics using Recharts:
- Hours driven per day (bar chart)
- Miles per day trend (line chart)
- Idle vs driving ratio (stacked bar)
- Peak activity hours (heatmap grid)
- Data source: `driver_timesheets` table
- New component: `UsageAnalytics.tsx`

### Implementation Order

Phase 1 (immediate value, data already available):
- Fleet Management Dashboard (widget cards from existing data)
- Usage Profile / Utilisation Charts (from timesheets)
- Business/Private Mileage Toggle

Phase 2 (requires new backend logic):
- Geofence Alerts (new tables + poller changes)
- Unauthorised Movement Alerts (new tables + poller changes)

Phase 3 (enhancement layer):
- Route Heatmap (needs multi-day route data aggregation)
- Scheduled Email Reports (new edge function + email integration)

### Technical Details

**Database migrations needed:**
- `geofences` table with RLS for instructor_id
- `geofence_alerts` table with RLS
- `movement_alerts` table with RLS
- `scheduled_reports` table with RLS
- New columns on `instructor_tracking_config` for working hours
- New `trip_classification` column on `mileage_logs`

**Edge function changes:**
- `quartix-poller`: Add geofence proximity check + after-hours movement detection on each poll cycle
- New `send-scheduled-report`: Cron-triggered function to generate and email reports

**New route:**
- `/instructor/fleet-dashboard` -- the new Vehicle Intelligence hub

**Existing dependencies used:**
- `leaflet` + `leaflet.heat` for heatmap
- `recharts` for usage analytics charts
- `jspdf` for scheduled PDF reports
- `date-fns` for date calculations

