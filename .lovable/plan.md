

## Plan: Add Geotab Driver Behaviour, Fuel Consumption, Geofence Alerts & Impact Detection

### What's being added

Four new Geotab data feeds with corresponding UI, plus wiring the existing geofence system to Geotab's Zone API.

---

### 1. Database Tables (3 new tables via migration)

**`geotab_driver_events`** — Stores harsh braking, acceleration, cornering, and speeding events from Geotab's `ExceptionEvent` API.
- `id`, `instructor_id`, `device_id`, `event_type` (harsh_brake, harsh_accel, harsh_corner, speeding), `rule_name`, `severity`, `latitude`, `longitude`, `speed_kmh`, `duration_seconds`, `started_at`, `ended_at`, `geotab_event_id` (unique), `created_at`

**`geotab_fuel_usage`** — Stores per-trip fuel consumption from Geotab's `FuelUsed` diagnostic.
- `id`, `instructor_id`, `device_id`, `trip_start`, `trip_end`, `fuel_used_litres`, `distance_km`, `litres_per_100km`, `cost_gbp`, `created_at`

**`geotab_impact_events`** — Stores high G-force / collision events from Geotab's accelerometer exception rules.
- `id`, `instructor_id`, `device_id`, `g_force`, `latitude`, `longitude`, `speed_kmh`, `event_time`, `severity` (low/medium/high/critical), `acknowledged`, `geotab_event_id` (unique), `created_at`

All tables get RLS policies scoped to `instructor_id` matching the authenticated user.

### 2. Edge Function: `geotab-behaviour-sync` (new)

Single new edge function that fetches all four data types in one batched Geotab call:

- **ExceptionEvent** — Queries Geotab for exception events (harsh braking, acceleration, cornering, speeding rules). Maps built-in rule names to event types. Inserts into `geotab_driver_events`. Events with G-force > 1.5g also insert into `geotab_impact_events` as potential collisions.
- **FuelUsed StatusData** — Queries `DiagnosticFuelUsedId` and correlates with trip distance to calculate litres/100km and cost (using instructor's `fuel_cost_per_litre` from settings).
- **Geofence checking** — Compares latest device position against all active geofences for the instructor. Inserts into existing `geofence_alerts` table on enter/exit (with cooldown to prevent duplicate alerts).

Called from the frontend on the Geotab Hub page, or can be scheduled via cron.

### 3. Frontend Hooks (3 new)

- **`useGeotabDriverEvents`** — Fetches from `geotab_driver_events`, supports date range. Returns events + summary scores (acceleration/braking/cornering/speed out of 100).
- **`useGeotabFuelUsage`** — Fetches from `geotab_fuel_usage`, returns trips with MPG/cost calculations.
- **`useGeotabImpactEvents`** — Fetches from `geotab_impact_events`, returns events sorted by severity.

### 4. UI Components (4 new, added as tabs to Geotab Hub)

**a. `GeotabDriverBehaviourTab.tsx`**
- Overall driving score (0–100) with Green/Amber/Red ring
- Four sub-scores: Speed, Acceleration, Braking, Cornering — each as a progress bar
- Event timeline: chronological list of harsh events with severity badges, location, speed
- Date range picker to filter

**b. `GeotabFuelTab.tsx`**
- Summary cards: Total fuel used, average MPG, total fuel cost
- Trip-by-trip fuel table: date, distance, litres, MPG, cost
- Bar chart of daily fuel consumption (Recharts)

**c. `GeotabImpactTab.tsx`**
- Alert cards for unacknowledged impact events with severity colour coding
- Each card shows: time, location, G-force, speed, severity, "Acknowledge" button
- History list of past events

**d. Enhanced `GeofenceAlertsList.tsx`**
- Already exists — will add real-time geofence checking via the new edge function
- Add push notification trigger on geofence entry/exit

### 5. Geotab Hub Updates

**`InstructorGeotabHub.tsx`** — Add 3 new tabs to the existing tab bar:
- "Behaviour" (Shield icon) → `GeotabDriverBehaviourTab`
- "Fuel" (Fuel icon) → `GeotabFuelTab`  
- "Impact" (AlertTriangle icon) → `GeotabImpactTab`

Tab bar goes from 8 to 11 tabs (scrollable, already supports overflow).

### 6. Geotab Poller Enhancement

Add to the existing `geotab-poller/index.ts` batched call:
- One additional `ExceptionEvent` Get call (last 2 minutes) for real-time impact detection
- If G-force > 2.0g detected, trigger push notification to instructor via existing `send-push-notification` function

### Files Changed

| File | Action |
|------|--------|
| Migration SQL | Create 3 tables + RLS |
| `supabase/functions/geotab-behaviour-sync/index.ts` | New edge function |
| `supabase/functions/geotab-poller/index.ts` | Add ExceptionEvent to batch |
| `src/hooks/useGeotabDriverEvents.ts` | New hook |
| `src/hooks/useGeotabFuelUsage.ts` | New hook |
| `src/hooks/useGeotabImpactEvents.ts` | New hook |
| `src/components/instructor/geotab/GeotabDriverBehaviourTab.tsx` | New component |
| `src/components/instructor/geotab/GeotabFuelTab.tsx` | New component |
| `src/components/instructor/geotab/GeotabImpactTab.tsx` | New component |
| `src/pages/InstructorGeotabHub.tsx` | Add 3 tabs |

