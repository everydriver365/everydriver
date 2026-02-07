

## Quartix Integration Plan

Bring all Quartix telematics data into the app for instructors and admins, replacing GPSgate as the primary tracking data source.

---

### Important: API Credentials Required

Quartix provides API access only through partner agreements. You mentioned you're still waiting on credentials. **This plan prepares everything so it works the moment you receive them.** Once you have your Quartix API key/token and account ID, we store them as backend secrets and the poller starts working immediately.

---

### Architecture: Data Source Swap

The existing database tables (`gps_devices`, `telematics_gps_points`, `lesson_telematics`, `telematics_alerts`) already store all the data your UI needs. The Quartix integration simply replaces **where that data comes from** -- no UI changes required.

```text
CURRENT:   GPSgate API  -->  gpsgate-poller  -->  gps_devices / telematics tables  -->  UI
NEW:       Quartix API  -->  quartix-poller  -->  same tables                      -->  UI
```

All existing features continue working unchanged:
- Live maps (instructor + admin)
- Trip replay with speed profiles
- Vehicle health dashboard
- Mileage auto-logging
- Driving behaviour alerts
- Driver scores and reports

---

### What Gets Built

#### 1. Database Migration -- Quartix Columns

Add Quartix-specific fields to `gps_devices` and a new `quartix_driver_scores` table:

**gps_devices additions:**
- `quartix_vehicle_id` (text) -- Quartix vehicle identifier
- `quartix_driver_id` (text) -- Quartix driver identifier
- `tracking_provider` (text, default 'gpsgate') -- 'gpsgate' or 'quartix', enables dual-provider support during migration

**New table: `quartix_driver_scores`**
- `id` (uuid PK)
- `instructor_id` (uuid, references instructors)
- `pupil_id` (uuid, nullable, references pupils)
- `quartix_driver_id` (text)
- `score_date` (date)
- `overall_score` (numeric)
- `speed_score` (numeric)
- `acceleration_score` (numeric)
- `braking_score` (numeric)
- `cornering_score` (numeric)
- `fatigue_score` (numeric)
- `raw_data` (jsonb) -- full Quartix response for future use
- `created_at` (timestamptz)

RLS: instructors can read their own scores. Admins can read all.

**New table: `instructor_tracking_config`**
- `id` (uuid PK)
- `instructor_id` (uuid, unique, references instructors)
- `provider` (text, default 'gpsgate') -- which provider this instructor uses
- `quartix_account_id` (text, nullable)
- `quartix_api_key` (text, nullable) -- per-instructor if needed, otherwise global
- `created_at` / `updated_at`

---

#### 2. Backend Function: `quartix-poller`

**New file: `supabase/functions/quartix-poller/index.ts`**

A backend function mirroring the GPSgate poller's role but calling Quartix endpoints:

- **Live Positions**: Fetch current vehicle positions from Quartix, write to `gps_devices` (same columns: `last_latitude`, `last_longitude`, `last_speed_kmh`, `last_heading`, `last_seen_at`, `last_road_name`, `last_ignition_status`)
- **Trip History**: Fetch completed trips, create `lesson_telematics` sessions with GPS points in `telematics_gps_points`
- **Driver Scores**: Fetch daily/weekly driver scores, store in `quartix_driver_scores`
- **Alerts**: Convert Quartix speeding/harsh-braking events into `telematics_alerts` rows
- **Odometer/Engine Hours**: Update `gps_devices` odometer and engine hours fields

The function checks `instructor_tracking_config` to only poll instructors using Quartix.

Secrets needed (when you get them):
- `QUARTIX_API_KEY`
- `QUARTIX_ACCOUNT_ID`
- `QUARTIX_API_URL` (base URL for the partner API)

---

#### 3. Backend Function: `quartix-trips`

**New file: `supabase/functions/quartix-trips/index.ts`**

Mirrors `gpsgate-trips` -- fetches detailed trip history for a specific vehicle/date range. Called on-demand from the Trip Replay UI to backfill GPS points for historical journeys.

---

#### 4. Instructor Settings -- Provider Selection

**Modified: `src/components/instructor/InstructorDetailsEditor.tsx`**

Add a "Tracking Provider" section:
- Radio toggle: GPSgate / Quartix
- When Quartix is selected, show fields for Quartix Vehicle ID and optional Driver ID
- Save to `instructor_tracking_config` table
- Hide GPSgate-specific fields when Quartix is selected

---

#### 5. Admin Dashboard -- Quartix Overview

**Modified: `src/components/admin/AdminLiveMapView.tsx`**

- Show a provider badge on each vehicle marker (GPSgate / Quartix)
- No other changes needed -- same data structure, same map rendering

**New component: `src/components/admin/QuartixDriverScores.tsx`**

- League table view showing all driver scores across instructors
- Filterable by date range, instructor, score type
- Colour-coded scores (green > 80, amber 60-80, red < 60)
- Added to AdminPortal under a "Driver Scores" section

---

#### 6. Instructor Portal -- Driver Scores Card

**New component: `src/components/instructor/QuartixDriverScoreCard.tsx`**

- Weekly/monthly score summary card showing overall, speed, braking, acceleration, cornering scores
- Trend arrows comparing to previous period
- Added to the instructor dashboard or vehicle health page

---

#### 7. Polling Schedule

**Modified: `invoke_gpsgate_poller` database function**

Create an equivalent `invoke_quartix_poller` function so both pollers can run on their own cron schedules. The existing 2-second client-side polling (`useGPSPoller`) will be updated to call the appropriate poller based on the instructor's provider setting.

---

### Implementation Order

| Step | What | Depends On |
|------|------|------------|
| 1 | Database migration (new tables + columns) | Nothing |
| 2 | `quartix-poller` edge function (stubbed, ready for API) | Step 1 + API credentials |
| 3 | `quartix-trips` edge function | Step 1 + API credentials |
| 4 | Instructor settings UI (provider toggle) | Step 1 |
| 5 | Admin driver scores component | Step 1 |
| 6 | Instructor driver score card | Step 1 |
| 7 | Polling schedule setup | Step 2 |

**Steps 1, 4, 5, and 6 can be built immediately.** Steps 2, 3, and 7 will be fully functional once you receive Quartix partner API credentials -- the code structure will be in place with placeholder API calls clearly marked.

---

### What You Need To Do

1. Contact Quartix (01686 806 663 or partnerships@quartix.com) and request partner API access
2. Once approved, you'll receive an API key, account ID, and API documentation
3. Share those credentials with me and I'll wire them into the ready-made poller

---

### Summary

- No UI changes needed for existing tracking features (maps, replays, mileage, alerts)
- New driver scores feature for both instructors and admins
- Dual-provider support so GPSgate instructors keep working alongside Quartix
- Everything ready to go live the day credentials arrive

Remove all other tracking systems and code