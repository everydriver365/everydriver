## Goal
Replace the flat, label-less stylised look of the Up Next mini map with a realistic Google Maps view that shows roads, place names, and an actual driving route to the pickup.

## Changes

### 1. Use realistic map styling
File: `src/components/instructor/upNext/MapHeroLive.tsx`
- Stop applying `dsmMapStyle` (which strips every label and POI). Use Google's default roadmap styling so road names, neighbourhoods and water labels appear naturally.
- Keep `disableDefaultUI`, no gestures, no zoom controls — it stays a non-interactive preview tile.
- Slightly reduce the zoom from `15` to `14` when a route is shown so both endpoints fit; otherwise keep 15 for a single pin.

### 2. Draw the actual driving route
- When the instructor's current location is available (use the existing `useInstructorLastPosition` hook already in the project), call the Google Directions service (already loaded via `loadGoogleMaps`) for `origin = current position`, `destination = pickup coords`, `travelMode: DRIVING`.
- Render the result as a `<Polyline>` in DSM red (`#CC2229`, 4px, 90% opacity) with a subtle white casing underneath (5px, white) for legibility on both light and dark roads.
- Add a small green "current location" dot overlay at the origin and keep the existing `DSMPin` at the destination.
- Fit the map bounds to the polyline with ~24px padding; fall back to the single-pin centered view if directions fail or current location is unknown.

### 3. Cache & performance
- Cache the directions result per `lessonId` in a module-level `Map` so re-mounts/scroll-revisits are instant (mirrors the existing `coordCache` pattern).
- Only request directions once the tile is visible (existing `IntersectionObserver` already gates this).
- Skip the Directions call entirely when origin and destination are within ~150m (just show the pin).

### 4. Keep all overlay pills unchanged
Countdown pill, ETA / "running late" pill, pupil avatar, and Details expand button stay exactly as they are.

## Out of scope
- The full-screen `HomeMapHero` and `RouteHeatmap` components — those already use realistic tiles and don't need changes.
- Any changes to live GPS tracking or the snap-to-road pipeline.

## Files touched
- `src/components/instructor/upNext/MapHeroLive.tsx` (main changes)
- `src/components/instructor/upNext/dsmMapStyle.ts` (no longer imported; can be left for now or deleted in a follow-up)
