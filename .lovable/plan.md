## Goal
Make every Geotab data point on the tile and Vehicle Health tab reflect live, accurate values from the Geotab API — including odometer/mileage, fault codes, fuel, impacts and last-seen time.

## Current state (from live DB)
- `gps_devices.last_seen_at` for Kenneth's Geotab is **15 Apr 2026** — stale; poller never updates it.
- `geotab_fault_codes`: **0 rows** despite cursors running cleanly. Bug: poller reads `f.diagnostic?.code/name` but Geotab returns `diagnostic` as an `{id}` reference — code/name resolve to `null` so every fault is skipped.
- `geotab_fuel_usage`: **0 rows** — poller has no fuel collector at all.
- `geotab_impact_events`: **0 rows** — only derived from exception rule names; rare.
- `dashcam_media`: **0 rows** — no MediaFile collector.
- **Mileage / odometer is never queried** anywhere. The tile and tab have no live mileage figure.
- `fault:GAE6D2TT5DUD` cursor is stuck with a Geotab "undefined exception" — never recovers because cursor is preserved on error.

## What to change

### 1. `supabase/functions/geotab-poller/index.ts`
- **New `pollDeviceStatus(device)`**: call `Get` `DeviceStatusInfo` with `deviceSearch:{id}`. Persist `odometer` (km), `latitude`, `longitude`, `dateTime` (last comm). Update `gps_devices.last_seen_at` + new `last_odometer_km` column on every poll. Insert a row into new `geotab_odometer_snapshots` for trend/mileage charts.
- **Fix `pollFaults`**:
  - Resolve `diagnostic` reference: maintain a per-poll `Map<diagnosticId, {code,name}>` populated by a single `Get` `Diagnostic` `{search:{ids:[…]}}` batched at the end.
  - Switch `insert` → `upsert` on a new unique key `geotab_fault_id` (we already capture `f.id`) to stop duplicates.
  - On Geotab "undefined exception", reset the cursor to null (so next run rebuilds from 30-day window) instead of preserving the bad fromVersion.
- **New `pollFuel(device)`**: `GetFeed` `FuelTransaction` (and fall back to summing `Trip.fuelUsed` when no fuel-card data). Map into `geotab_fuel_usage`.
- **New `pollDashcam(device)`**: `GetFeed` `MediaFile` filtered by `device`. Persist file URL, thumbnail, `recorded_at`, `duration_seconds`, `is_incident` based on associated event.
- **New `pollImpacts(device)`**: `GetFeed` `AccidentEvent` (richer than the rule-name heuristic) and merge with current impact upserts. Capture `g_force`, `speed`, `lat/lng`.
- Keep all calls behind the existing `geotab_sync_cursors` pattern; add cursors for `status`, `fuel`, `media`, `accident` per device.

### 2. Database migration
- Add columns to `gps_devices`: `last_odometer_km numeric`, `last_position_lat numeric`, `last_position_lng numeric`.
- Add unique constraint on `geotab_fault_codes(device_id, geotab_fault_id)` (and add the `geotab_fault_id text` column if missing) to support upsert.
- New table `geotab_odometer_snapshots(instructor_id, device_id, odometer_km, captured_at)` with RLS scoped via `get_instructor_id_for_user(auth.uid())` + service-role grant for the poller. Indexed on `(device_id, captured_at desc)`.

### 3. Front-end surfacing (read-only, hooked into existing components)
- **`useGeotabHealth.ts`**: extend `GeotabHealthSummary` with `odometerMiles: number | null`, `last7dMiles: number | null` (computed from `geotab_odometer_snapshots` delta) and `lastCommAt: string | null` (from `gps_devices.last_seen_at`).
- **`VehicleHealthGeotabTile.tsx`**: under the device name line, add a small "X mi · last seen Yh ago" stat row. Hidden if odometer is null.
- **`GeotabTab.tsx` Overview**: replace the static "Last sync" card with a "Vehicle" card showing odometer (miles), last 7-day miles, last-seen timestamp. Fault, Fuel, Impacts sections will populate automatically once the poller writes rows.
- **Manual "Sync now" button** on the Overview card → invokes `supabase.functions.invoke('geotab-poller')` and refreshes queries on success (uses existing query keys).

### 4. Cron
- No new schedule — existing 1-min cron already invokes `geotab-poller`; the new sub-pollers run in the same Promise.all per device.

## Out of scope
- No new auth/connection flow (uses existing Geotab service-account creds).
- No changes to GPS/native tracking pipeline.
- Desktop layout untouched; tile change is mobile-only.
- No new charts/graphs — odometer trend stored, but UI just shows numbers for now.

## Testing
- Run `geotab-poller` manually after deploy; expect:
  - `gps_devices.last_seen_at` within ~1 min of now for both Kenneth devices.
  - `geotab_fault_codes` > 0 rows (Geotab fleet typically has stored faults).
  - `geotab_odometer_snapshots` 1 row per device per run.
- Tile displays "Geotab · Kenneth's Geotab" + "12,345 mi · last seen 1m ago".
- Vehicle Health Overview shows the new Vehicle card with odometer; tapping "Sync now" refreshes within 5 s.