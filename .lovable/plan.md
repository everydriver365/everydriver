<final-text>## Fix speed limits not appearing on live tracking

### What I found
- The live tracking UI already supports speed limits:
  - the fullscreen map roundel reads `gps_devices.last_speed_limit_kmh`
  - the hero card also shows a limit when that value exists
- The issue is the data pipeline, not the display:
  - active device rows currently have `last_speed_limit_kmh = null`
  - recent GPS points for the active session also have `speed_limit_kmh = null`
  - recent Radius logs show incoming telemetry with `speed_limit_kmh: null`
  - Geotab logs are also returning `0 speed limits`
- There is also a direct bug in the Radius backend: it parses a speed limit value, but does not write it back to `gps_devices`, so the fullscreen map would still miss it even when Radius does provide one.

### Plan
1. Add a shared backend speed-limit lookup helper
   - Create a shared helper for backend functions that:
     - checks the existing `speed_limit_cache` table first
     - falls back to a road-speed lookup source (best fit: OpenStreetMap/Overpass)
     - normalizes the result into km/h
     - stores the resolved value back in `speed_limit_cache`

2. Fix Radius device updates
   - Update `radius-poller` so the resolved speed limit (provider value first, fallback second) is written to:
     - `gps_devices.last_speed_limit_kmh`
     - `telematics_gps_points.speed_limit_kmh`
     - `live_pupil_positions.speed_limit_kmh`

3. Add the same fallback to Geotab
   - Update `geotab-poller` so when Geotab returns no speed-limit result, it uses the same shared lookup helper before saving telemetry.
   - Keep tracker-provided values as the first choice when available.

4. Keep the UI mostly unchanged
   - The current map and hero components should start showing limits automatically once the backend writes real values.
   - Only add a tiny UI fallback if testing shows the fullscreen map still lags behind the latest enriched telemetry.

### Files to update
- `supabase/functions/radius-poller/index.ts`
- `supabase/functions/geotab-poller/index.ts`
- new shared helper in `supabase/functions/_shared/`
- possibly `src/components/instructor/GoogleLiveTrackingMap.tsx` only if a small fallback is needed after testing

### Technical notes
- No schema change is needed; the needed columns and `speed_limit_cache` table already exist.
- No auth or RLS change is needed; this is not a permissions problem.
- There is already a client-side cache utility in `src/lib/speedLimitCache.ts`, but this page reads live device data from the backend, so the real fix belongs in the backend pollers.

### Validation
- Confirm active device rows start receiving non-null `last_speed_limit_kmh`
- Confirm new session GPS points store non-null `speed_limit_kmh`
- Confirm the fullscreen tracking map and hero card show the same speed limit during a live update</final-text>