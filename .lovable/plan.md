## Goal

Two tweaks to the live tracking map in `src/components/instructor/tracking/SatNavLiveMap.tsx`:

1. **Top-down car icon** replaces the current blue chevron/arrow marker.
2. **Always follow** — map locks onto the car. Dragging never breaks follow mode.

## 1. Top-down car marker

Replace `getArrowIcon()` / `getShadowIcon()` with a single inline-SVG data-URL of a top-down car silhouette (rounded hatchback, navy `#1C2A4A` body, light grey windscreen/rear window, subtle drop shadow built into the SVG itself — no separate shadow marker needed).

- Size: ~40×72 px (rotates around centre).
- `google.maps.Marker` keeps using `icon.rotation` via the `path` field — but since data-URL icons don't rotate natively, we'll switch to a `google.maps.Symbol` style isn't possible for raster. Instead: pre-rotate the SVG by rebuilding the data-URL each heading update (cheap — only when heading changes >2°).
- Drop the shadow marker entirely (the SVG carries its own shadow).
- "Inactive" state (no fix / paused) just desaturates the SVG to grey.

## 2. Always-follow camera

Currently `setFollowMode(false)` is called on `dragstart` and `zoom_changed`. We'll:

- Remove those listeners.
- Keep `followModeRef.current = true` permanently.
- Delete the floating "Re-centre" button (lines ~1137-1164) — no longer needed.
- Delete the compass/recenter events the FloatingSessionTimer dispatches (they'd be no-ops). The compass button stays for visual parity but becomes inert — or we can remove it. **Question for build phase: remove compass + recentre buttons from the right-edge stack, or leave them inert?** I'll remove them to keep the stack honest.

## Files touched

- `src/components/instructor/tracking/SatNavLiveMap.tsx` — new marker icon, remove drag/zoom follow-off listeners, remove re-centre button.
- `src/components/instructor/tracking/FloatingSessionTimer.tsx` — drop Compass + Crosshair buttons from the right-edge stack (mute + hazard remain).

## Out of scope

No backend, no GPS polling changes, no buffer/snap logic changes. Pure marker + camera-follow behaviour.
