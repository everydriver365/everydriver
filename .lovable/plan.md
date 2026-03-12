

# Radius/Velocity Fleet Telematics Integration

## Overview
Create a `radius-poller` edge function that polls the Velocity Fleet API for live device positions, writing to the existing `gps_devices` table with `tracking_provider = 'radius'`. All existing maps, dashboards, and hooks work automatically.

## Steps

### 1. Request Secrets
Two secrets needed via the `add_secret` tool:
- **`RADIUS_REFRESH_TOKEN`** — from the Velocity Portal API settings
- **`RADIUS_CUSTOMER_ID`** — the customer ID for the positions endpoint

### 2. Database Migration
Create a `radius_session_cache` table (mirrors `geotab_session_cache`):
```sql
CREATE TABLE IF NOT EXISTS public.radius_session_cache (
  id TEXT PRIMARY KEY DEFAULT 'default',
  access_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.radius_session_cache ENABLE ROW LEVEL SECURITY;
```

### 3. Edge Function: `supabase/functions/radius-poller/index.ts`
Following the exact pattern of `geotab-poller`:

- **Auth flow**: Check in-memory cache → DB cache (`radius_session_cache`) → POST to `https://www.velocityfleet.com/vapi/v1/accounts/users/oauth2/refresh/` with the refresh token. Cache the access token with 29-day expiry.
- **Poll positions**: POST to `https://www.velocityfleet.com/api/mobile/kinesis/device-live-positions/?customer={RADIUS_CUSTOMER_ID}` with Bearer token.
- **Match devices**: Query `gps_devices` where `tracking_provider = 'radius'`, match by `device_identifier` against the Radius device `id` (stringified).
- **Map fields**:
  - `lat` / `lon` → `last_latitude` / `last_longitude`
  - `speed` (MPH) × 1.60934 → `last_speed_kmh`
  - `direction` → `last_heading`
  - `ignition === "Y"` → `last_ignition_status`
  - `street` (+ `town`) → `last_road_name`
  - `timestamp` (Unix epoch) → `last_seen_at`
  - `vehicle_registration` → `device_name` (fallback)
  - Set `last_heartbeat_at` = now
- **Active sessions**: If device has `current_session_id`, write GPS points to `telematics_gps_points` and increment distance (same as Geotab).

### 4. Register in Config
Add to `supabase/config.toml`:
```toml
[functions.radius-poller]
verify_jwt = false
```

### 5. Frontend: Trigger Radius Poller
In `src/hooks/useVehicleHealth.ts`, update `triggerPoller` to also invoke `radius-poller` alongside `geotab-poller`:
```typescript
await Promise.allSettled([
  supabase.functions.invoke("geotab-poller", { method: "POST" }),
  supabase.functions.invoke("radius-poller", { method: "POST" }),
]);
```

### 6. Admin Device Registration
Radius devices are registered in admin with `tracking_provider = 'radius'` and the Radius numeric device ID as `device_identifier`. No new admin UI needed beyond ensuring "radius" appears in the provider dropdown (it already accepts freetext).

## Data Flow
```text
Velocity Fleet API (30-60s poll)
       │
radius-poller edge function
       │
gps_devices table (tracking_provider = 'radius')
       │
Existing hooks & components (no changes needed)
```

## Not Yet Covered
- Trip history, engine diagnostics, dashcam — pending API endpoint documentation from user.

