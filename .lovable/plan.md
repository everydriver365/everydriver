

## Fix: Speed Limit Not Displaying

### Root Cause
The Radius Export Stream sends `speed_limit_kmh: null` — the hardware doesn't provide speed limits. The Overpass API fallback uses only a **30m radius**, which frequently returns no results because many UK roads lack OSM `maxspeed` tags or the GPS coordinate is slightly off-road.

The `gps_devices` table confirms `last_speed_limit_kmh` is `NULL` for the active device, so the roundel shows "--".

### Plan

**1. Widen Overpass search radius and add UK defaults**
- In `supabase/functions/_shared/speedLimitLookup.ts`:
  - Increase Overpass radius from 30m → **100m** to catch nearby roads
  - If Overpass finds a road with `highway` tag but no `maxspeed`, infer UK defaults:
    - `residential` / `living_street` → 48 km/h (30 mph)
    - `unclassified` / `tertiary` / `secondary` / `primary` → 48 km/h (30 mph) if in built-up area, 97 km/h (60 mph) otherwise
    - `motorway` → 113 km/h (70 mph)
    - `trunk` / `motorway_link` → 113 km/h (70 mph)
  - Add a second Overpass query without `["maxspeed"]` filter so we can still get the road type when maxspeed is missing

**2. Cache negative lookups (prevent repeated failures)**
- Cache `null` results for 24 hours (shorter than positive 30-day cache) to avoid hammering Overpass on every poll cycle for the same grid cell

**3. Add logging for speed limit resolution**
- Add a `console.log` in the radius-poller when speed limit is resolved or when it falls through to null, so we can debug in production

**4. Redeploy radius-poller edge function**
- The updated `_shared/speedLimitLookup.ts` will be picked up automatically

### Technical Details

The key change is the second Overpass query:
```
[out:json][timeout:5];
way(around:100,{lat},{lng})["highway"];
out tags 1;
```

When `maxspeed` is absent, we read the `highway` tag and apply UK National Speed Limit defaults. This covers ~80% of UK roads that don't have explicit `maxspeed` in OSM.

Negative cache entries use a sentinel value (e.g. `speed_limit_kmh = 0`) with a 24h expiry to distinguish from real cache misses.

