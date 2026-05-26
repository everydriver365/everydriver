## Why the car still shows as a small circle

Google Maps loads marker icon URLs in a sandboxed image context that **blocks external `<image href="...">` references inside a data‑URI SVG**. The previous attempt embedded the imported `tracking-car.png` URL via `<image href>` inside the SVG data URI — Maps resolved the SVG as empty and fell back to its default dot. That's the "small circle" on screen.

## Fix

Single file: `src/components/instructor/tracking/SatNavLiveMap.tsx`.

1. Rewrite `getArrowIcon` to return a `google.maps.Icon` whose `url` is a data‑URI SVG containing a **pure inline car silhouette** (no `<image href>`, no external asset). Rotation stays handled by `<g transform="rotate(${heading} 28 28)">` so per‑frame heading updates keep working with classic `google.maps.Marker` (no `mapId` / AdvancedMarker required).
2. Car design, top‑down, 56×56 viewport, pointing north at rotation 0:
   - Body: rounded rect, fill `#1C2A4A`, white stroke 1px for contrast on satellite tiles.
   - Roof panel: lighter rounded rect, fill `#2E4373`.
   - Windshield wedge: `#A8C5E8` polygon at the front.
   - Two wing‑mirror nubs and four wheel dots in `#0B1426`.
   - Active opacity 1.0, inactive 0.55 (unchanged behaviour).
   - `scaledSize: 56×56`, `anchor: (28, 28)` (unchanged).
3. Remove the now-unused `import trackingCarUrl from "@/assets/tracking-car.png"`. The PNG file stays on disk but is no longer referenced.

Everything else is untouched: shadow halo, marker creation, tween/animation loop, first‑fix seeding, camera / zoom logic, polyline trail, fullscreen routing, and all call sites of `getArrowIcon`.

## Out of scope

- `LiveTrackingMap.tsx`, `GoogleLiveTrackingMap.tsx`, `MiniLiveMap` — not changed.
- `InstructorLiveSession.tsx` layout — not changed.
- No mobile layout changes elsewhere.
- No animation, camera, or data‑flow changes.
