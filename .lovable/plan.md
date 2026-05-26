## Why there's no car symbol

The previous attempt edited `src/components/instructor/GoogleLiveTrackingMap.tsx`, but that component is **not imported anywhere**. The live tracking page (`/instructor/tracking`) actually renders the **Leaflet** variant: `src/components/instructor/LiveTrackingMap.tsx`. So the car-path change had zero visible effect.

The Leaflet variant does build a `buildCarIcon()` divIcon with an inline `<svg>` car, but the `<svg>` element has **no `width`/`height` attributes** — only `viewBox="0 0 24 24"`. Inside its 24×24 rotator wrapper this collapses or overflows depending on the browser/WebKit build, which is why no recognisable car appears on the marker (you just see the blue ring, or nothing).

A secondary cause: the marker is only added when a live GPS fix exists. If the device hasn't reported in this session, no marker is drawn at all — but the ring-with-no-car symptom only happens when a position *is* present, which matches the user's complaint.

## Fix

Edit `src/components/instructor/LiveTrackingMap.tsx`, `buildCarIcon()` (around lines 86–103):

1. Add explicit `width="20" height="20"` (and `display:block`) to the `<svg>` so it renders at the intended size inside the 24×24 rotator.
2. Keep the existing blue ring, white car fill, rotation transition, and `iconAnchor`/`iconSize` — no behavioural change.

Resulting marker: 44px blue circle with a clearly visible 20px white top-down car SVG, rotated by heading, exactly as the rest of the design implies.

## Cleanup

`GoogleLiveTrackingMap.tsx` is dead code. Out of scope for this fix — leave it as-is unless you want a follow-up to delete it.

## Files touched

- `src/components/instructor/LiveTrackingMap.tsx` (one small JSX/HTML change inside `buildCarIcon`)

## Out of scope

- No change to ring colour, size, rotation logic, polyline, auto-follow, or any data flow.
- No deletion of the unused `GoogleLiveTrackingMap.tsx`.
- No changes to the mobile layout or tracking-page tile widths.
