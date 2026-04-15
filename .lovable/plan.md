

## Real-Time Fleet Map with Overspeed Detection — Implementation Plan

### 1. Database Migrations (3 migrations)

**Migration A — Create `overspeed_events` table**
```sql
CREATE TABLE overspeed_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telematics_id uuid REFERENCES lesson_telematics(id) ON DELETE CASCADE,
  device_id uuid REFERENCES gps_devices(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL,
  speed_kmh numeric NOT NULL,
  speed_limit_kmh numeric NOT NULL,
  excess_kmh numeric NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  road_name text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(telematics_id, recorded_at)
);
CREATE INDEX ON overspeed_events(device_id, recorded_at DESC);
CREATE INDEX ON overspeed_events(telematics_id);
ALTER TABLE overspeed_events ENABLE ROW LEVEL SECURITY;
-- RLS: instructors can read their own events via gps_devices join
```

**Migration B — Add `is_speeding` columns**
- `telematics_gps_points.is_speeding boolean DEFAULT false`
- `gps_devices.last_is_speeding boolean DEFAULT false`

**Migration C — Enable Realtime on `gps_devices`**
- `ALTER PUBLICATION supabase_realtime ADD TABLE public.gps_devices;`

No changes to `update_live_position` RPC or cron job (already running at 5s).

---

### 2. Replace `radius-poller` Edge Function

Replace the entire `supabase/functions/radius-poller/index.ts` with the user-provided version. Key changes from current:
- Adds `last_is_speeding` to the `gps_devices` update
- Inserts into `overspeed_events` when speeding is detected (with dedup via `onConflict`)
- Sets `is_speeding` on `telematics_gps_points` inserts
- Uses `spd.mx` (alert threshold) instead of `spd.rd` (posted limit) per KT docs
- Geocode cache to avoid repeated Nominatim calls
- Parallel `Promise.allSettled` for device processing
- Batch deletion only after all DB writes succeed

---

### 3. Fleet Map Page — `src/pages/InstructorFleetMap.tsx`

**Route:** `/instructor/fleet-map` added to `instructorPortalRoutes.tsx`

**Data:**
- On mount: fetch all `gps_devices` where `tracking_provider = 'radius'` for the instructor
- Subscribe to Supabase Realtime `UPDATE` events on `gps_devices` — no polling timer

**Google Maps markers:**
- SVG directional arrow rotated by `last_heading` (0–360°, 0 = north)
- Green when `last_is_speeding = false`
- Red + CSS pulse animation when `last_is_speeding = true`
- Grey when `last_heartbeat_at` > 60s ago, label shows "Signal lost"
- Label beneath: device name + speed in mph

**Click popup:** Speed, limit, road, ignition on/off, last seen as relative time

**Overspeed toast (sonner):**
- Triggered when `last_is_speeding` flips `false → true` on a Realtime event
- **Only fires if `last_heartbeat_at` < 30 seconds old** (prevents stale alert floods)
- Auto-dismiss after 8s, stacks for multiple vehicles
- Format: "[Vehicle] — speeding at [speed] in a [limit] zone on [road]"

**Controls:**
- "Fit all" button to auto-zoom bounds
- Toggle to show/hide signal-lost vehicles
- Live counter: "X vehicles active, Y speeding"

---

### 4. Overspeed History Page — `src/pages/InstructorOverspeedHistory.tsx`

**Route:** `/instructor/overspeed-history`

**Summary row at top:**
- Total overspeed events today
- Worst excess speed today (km/h over limit)
- Vehicle with most events today

**Table:** Date/time, Vehicle (device name via join), Road, Speed, Limit, Excess (red text)

**Filters:** Date range picker, vehicle dropdown (default: today)

**Sorting:** `recorded_at DESC` default, all columns sortable

**Export:** CSV download button for filtered view

---

### 5. Navigation

Add "Fleet Map" and "Overspeed History" to `instructorPortalRoutes.tsx` under the Vehicle & GPS section, gated behind the `telematics` feature flag.

