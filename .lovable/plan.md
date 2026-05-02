# Sharpen the Live Tracking map

Single file changed: `src/components/instructor/tracking/SatNavLiveMap.tsx`

## What changes
1. **Zoom 17 → 18.5** in fullscreen so road names and side streets are readable.
2. **Tilt 45° → 30°** so labels stop distorting at the horizon while keeping a 3D feel.
3. **Two-tone route polyline** (Google/Waze-style):
   - Casing: `#1e3a8a` weight 9, opacity 0.9
   - Top: `#3b82f6` weight 6, opacity 1
   Adds a second `Polyline` instance kept in sync with the existing path.
4. **Bigger, higher-contrast arrow marker**: scale 3.2 → 3.6, stroke 2.5 → 3, fill `#2563eb`.
5. **Off-centre camera pan**: shift the vehicle ~30% from the bottom of the viewport so the road *ahead* is visible. Uses the map's projection to offset the panTo target along the heading.
6. **Decluttering map style array**: hides business POIs, transit stops, and minor labels; keeps roads, schools, and place names. Requires removing the unused `mapId: "sat-nav-map"` (cloud-styled mapIds ignore inline `styles`); we don't rely on cloud styling so this is safe.

## Files
- `src/components/instructor/tracking/SatNavLiveMap.tsx` — only file touched. No backend, telemetry, GPS pipeline, or RLS changes.

## Risk
Low. All changes are visual/SDK-config. The casing polyline mirrors the existing path so route accuracy is unchanged. If the off-centre pan feels disorienting we can revert that single hunk.
