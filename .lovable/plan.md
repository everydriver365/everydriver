

# Geotab Hub: Centralised Geotab Section for Instructors and Admin

## What We're Building

A dedicated **Geotab Hub** section that consolidates all Geotab-powered features into one organised area, accessible to both instructors (who have a Geotab device assigned) and admins (who manage all devices). This brings together route history, trip reports, dashcam footage, vehicle diagnostics, and live tracking under a single "Geotab" navigation entry.

## Current State

The app already has most of the individual Geotab features built but scattered across different pages:
- **Live Map** -- inside Fleet Dashboard tab
- **Trip Replay** -- standalone page at `/instructor/trip-replay`
- **Dashcam Gallery** -- standalone page at `/instructor/dashcam`
- **Vehicle Health** (fuel, battery, faults) -- at `/instructor/vehicle-health`
- **Route Heatmap** -- inside Fleet Dashboard tab
- **Geofences & Alerts** -- inside Fleet Dashboard tab
- **Mileage Tracking** -- inside Fleet Dashboard tab
- **Admin Tracker Management** -- inside Admin Portal "GPS Trackers" section

What's missing is a unified Geotab section and a few key features: **Trip History Log** (list of all trips with summary data), **Report Generation** from trip data, and an admin-level Geotab overview across all instructors.

## Plan

### 1. New Instructor Page: `/instructor/geotab`

A tabbed page with all Geotab features consolidated:

| Tab | Content | Status |
|-----|---------|--------|
| **Overview** | Device status cards, fuel/battery/fault summary | Reuses `EnhancedDeviceStatusCard` + `CheckEngineBanner` |
| **Live Map** | Real-time vehicle position | Reuses `FleetLiveMap` |
| **Trips** | Sortable trip history list with distance, duration, scores | **NEW** -- calls `geotab-poller` Trip API |
| **Routes** | Trip replay with animated playback | Links to existing `/instructor/trip-replay` |
| **Dashcam** | Video/image gallery with filters | Reuses existing `DashcamGallery` content |
| **Reports** | Generate PDF driving reports per trip/date range | Reuses existing `generate-route-report` + `generate-driving-report` edge functions |
| **Diagnostics** | Fuel, battery, coolant trends + fault code history | Reuses `BatteryHistoryChart` + fault display |
| **Geofences** | Zone editor and alert history | Reuses `GeofenceEditor` + `GeofenceAlertsList` |

Access is gated: only instructors with a Geotab device assigned (via admin) see the section in their navigation. Others see a "Not Available" card explaining it needs to be set up by their admin.

### 2. New Admin Section: "Geotab Fleet" in Admin Portal

A new section in the admin sidebar under "System Settings" that provides a cross-instructor Geotab overview:

| Sub-section | Content |
|-------------|---------|
| **All Devices** | Existing tracker manager with enhanced status columns (last seen, fuel %, faults) |
| **Fleet Overview** | Aggregated stats: total devices, online/offline counts, devices with active faults |
| **Trip History** | View trips across all instructors with instructor filter dropdown |
| **Dashcam** | View dashcam footage across all instructors with instructor filter |
| **Reports** | Generate fleet-wide reports (total mileage, fault summaries, trip counts per instructor) |

### 3. New Edge Function: `geotab-trips`

Fetches trip data from the Geotab API `Get<Trip>` for a given device and date range:

- Input: `instructorId`, `fromDate`, `toDate`
- Authenticates with Geotab using existing credentials
- Fetches `Trip` objects for the instructor's devices
- Returns: array of trips with start/end time, distance (km), duration, idle time, start/end coordinates
- No database storage needed initially -- fetched on demand (with client-side caching via React Query)

### 4. New Component: `GeotabTripHistory`

A table/list component showing:
- Date/time of trip
- Start and end addresses (reverse geocoded)
- Distance (miles)
- Duration
- Max speed
- Link to replay the trip route

### 5. Navigation Updates

**Instructor side:**
- Add "Geotab" entry to the instructor navigation menu (with a satellite/tracker icon)
- Only visible when instructor has an active Geotab device

**Admin side:**
- Add "Geotab Fleet" entry under System Settings in admin sidebar
- Always visible for admins

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/InstructorGeotabHub.tsx` | Main Geotab hub page with tabs |
| `src/components/instructor/geotab/GeotabTripHistory.tsx` | Trip history list component |
| `src/components/instructor/geotab/GeotabOverviewTab.tsx` | Overview tab with device status summary |
| `src/components/instructor/geotab/GeotabReportsTab.tsx` | Report generation tab |
| `src/components/admin/AdminGeotabFleet.tsx` | Admin fleet-wide Geotab view |
| `supabase/functions/geotab-trips/index.ts` | Edge function to fetch Trip data from Geotab API |
| `src/hooks/useGeotabTrips.ts` | React Query hook for trip data |

### Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add route `/instructor/geotab` |
| `src/pages/AdminPortal.tsx` | Add "Geotab Fleet" section with `AdminGeotabFleet` component |
| `src/components/layout/InstructorPortalLayout.tsx` (or nav config) | Add Geotab nav item, conditionally shown |
| `supabase/config.toml` | Not modified (auto-managed), but new edge function will auto-deploy |

### Geotab Trip API Call Structure

```text
Method: "Get"
TypeName: "Trip"
Params:
  deviceSearch: { id: <geotab_internal_id> }
  fromDate: <ISO string>
  toDate: <ISO string>

Returns per trip:
  - id, dateTime (start), nextTripStartTime
  - distance (metres), drivingDuration (seconds)
  - idlingDuration (seconds)
  - maximumSpeed (km/h), averageSpeed (km/h)
  - startPoint { x, y }, stopPoint { x, y }
  - stopDuration
```

### Access Control

- Instructor Geotab Hub: requires authenticated instructor with at least one `gps_devices` row where `tracking_provider = 'geotab'`
- Admin Geotab Fleet: requires admin role (existing `has_role` check)
- `geotab-trips` edge function: validates auth token, checks instructor ownership of devices

