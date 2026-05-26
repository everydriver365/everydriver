## Why earlier edits didn't fix it

You're on `/instructor/tracking?fullscreen=true` with an active session, so the page renders **`src/components/instructor/tracking/SatNavLiveMap.tsx`** (Google Maps). Previous edits in this thread touched:

- `src/components/instructor/LiveTrackingMap.tsx` (Leaflet) — not mounted on this route
- `src/components/instructor/GoogleLiveTrackingMap.tsx` — not imported anywhere

That's why nothing changed visually. The car marker on the screen you're looking at is defined inside `SatNavLiveMap.tsx` at `getArrowIcon` (lines ~398–410) as a small dark-navy vector path — easy to miss against map tiles.

## Fix — only edit the file that's actually rendered

**`src/components/instructor/tracking/SatNavLiveMap.tsx`** (no other files touched):

1. Generate a top-down car PNG asset (transparent background, navy hatchback, pointing north) → `src/assets/tracking-car.png` via image generation, and import it as an ES6 module.
2. Replace the `getArrowIcon` body so it returns a `google.maps.Icon` built from a **rotated inline SVG data URI** that embeds the imported PNG via `<image href=…>` and a `<g transform="rotate(${heading} 24 24)">`. This keeps smooth per-frame rotation working with classic `google.maps.Marker` (no `AdvancedMarkerElement` / `mapId` needed).
3. Size: 48×48 px, anchored at centre (24,24). Active opacity 1.0, inactive 0.55 — preserving the existing active/inactive visual.
4. Leave everything else untouched: marker creation, shadow halo, tween/animation loop, first-fix seeding, camera/zoom logic, polyline trail, the fullscreen routing in `InstructorLiveSession.tsx`, and the standard tracking layout fixes from earlier.

## Out of scope

- `LiveTrackingMap.tsx`, `GoogleLiveTrackingMap.tsx`, `MiniLiveMap` — not changed
- No animation, camera, or data-flow changes
- No mobile layout changes elsewhere
