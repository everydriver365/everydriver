# Geotab Integration — Build Plan

Answers locked in: ProPlus video enabled, new pinned tile (Geotab-only), 1-min poller, ship step-by-step (proof-of-life first).

## Phase 1 — Auth + proof of life
- Migration: new `geotab_sync_cursors` table (instructor_id, cursor_name, last_run_at, last_from_version) + RLS + grants.
- Edge function **`geotab-auth`** — `Authenticate` against `GEOTAB_USERNAME / PASSWORD / DATABASE`, cache session in `geotab_session_cache`, refresh on `InvalidUserException`.
- Edge function **`geotab-status`** — on-demand: `Get DeviceStatusInfo` + `Get StatusData` for one device, returns live position, ignition, odometer, battery V, coolant temp, fuel level / EV SOC, tyre pressure (where reported).
- Smoke test against the 1 device already flagged `tracking_provider = 'geotab'` via `curl_edge_functions`.
- Deliverable: confirmed creds work and we can read live data.

## Phase 2 — Incremental poller (1 min cron)
- Edge function **`geotab-poller`** — for each instructor with a Geotab device:
  - `Get ExceptionEvent` since cursor → upsert `geotab_driver_events` (dedupe on `geotab_event_id`)
  - `Get FaultData` since cursor → upsert `geotab_fault_codes`, close codes no longer active
  - `Get LogRecord` + accelerometer / impact rule → upsert `geotab_impact_events`
  - `Get FuelTransaction` since cursor → insert `geotab_fuel_usage`
  - `Get Trip` since cursor → backfill `scheduled_lessons.geotab_trip_id` by matching device + time window
- `pg_cron` every 1 min calling the function via `net.http_post` (per project pattern).
- Edge function **`geotab-backfill`** — one-shot, last 30 days, run manually after first deploy.

## Phase 3 — Mobile homepage pinned tile (Geotab only)
- Extend `useActiveTrackingProvider` to expose `hasGeotab: boolean`.
- Add new tile id `"vehicle-health-geotab"` to `quickActionsCatalog` + `useInstructorPinnedTiles`. Tile is **only registered when `hasGeotab === true`** — invisible to everyone else (no empty state).
- Tile content (live, derived from DB only — no fallbacks):
  - Health score 0–100 (active faults − weight, harsh events 24h − weight, battery V threshold)
  - Sub-line: "N active fault(s)" or "All systems normal"
  - Red dot if unacknowledged impact in last 24h
- Tap → `/instructor/vehicle-health` (Geotab tab).
- Loading state: shimmer skeleton until first `StatusData` row exists; if never, tile auto-hides.

## Phase 4 — Vehicle Health Geotab tab (mobile)
- New tab inside `InstructorFleetDashboard.tsx` (or new dedicated page reusing portal layout — TBD by code shape), gated on `hasGeotab`. Sub-tabs:
  1. **Overview** — health score, today's events, latest impact, fuel cost, last sync
  2. **Driver Behaviour** — list + small map of `geotab_driver_events`, filter by type/severity/pupil (joined via `scheduled_lessons.geotab_trip_id`)
  3. **Vehicle Health** — current diagnostics from latest `StatusData`, active fault codes with OBD descriptions (reuse `src/lib/obdCodeLookup.ts`)
  4. **Impacts** — collision feed with Acknowledge button (writes `acknowledged=true`)
  5. **Fuel / EV** — trips, L/100km, GBP cost trend
  6. **Video** — ProPlus dashcam clips via new edge function **`geotab-media`** (`Get MediaFile` list + signed download proxy → `dashcam_media`), thumbnail grid + inline playback
- Imperial display (mph, miles) per project memory; DSM tokens, rounded-2xl, #F4F7F6 bg.

## Phase 5 — Desktop instructor portal
- Same 6 sub-tabs inside the existing Fleet/Telematics desktop router, two-column layout (list left, detail right), desktop portal theme (#2D3FE7 / #00C8B8).

## Phase 6 — Admin oversight
- New admin section "Geotab" — read-only, cross-instructor:
  - Unacknowledged impacts (global feed)
  - Active fault codes
  - Poller health: last successful run per instructor, error count
  - Per-device status table
- Filtered by `is_network_placeholder = false` per memory rule.

## Out of scope (explicit)
- Writing rules / geofences back to Geotab (read-only integration)
- Pupil-facing surfaces (kept on existing `lesson_telematics`)
- Migrating Radius / Quartix users

## Files touched
- New: `supabase/functions/geotab-auth/`, `geotab-status/`, `geotab-poller/`, `geotab-backfill/`, `geotab-media/`
- New: `src/hooks/useGeotabHealth.ts`, `src/hooks/useGeotabEvents.ts`, `src/hooks/useGeotabFaults.ts`, `src/hooks/useGeotabImpacts.ts`, `src/hooks/useGeotabMedia.ts`
- New: `src/components/instructor/geotab/*` (tabs, tile, score calc)
- Edit: `src/hooks/useActiveTrackingProvider.ts` (expose `hasGeotab`)
- Edit: `src/lib/quickActionsCatalog.ts` + `useInstructorPinnedTiles.ts` (conditional tile)
- Edit: `src/pages/InstructorFleetDashboard.tsx` + desktop equivalent + admin route
- Migration: `geotab_sync_cursors` table + cron job
- Memory: add `mem://features/instructor/geotab-integration`

## What I need from you to start
Approve and I'll ship Phase 1 first (auth + status proof-of-life) so we can verify creds before building the full pipeline.
