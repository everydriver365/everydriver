## Goal

Swap the static Google Maps image in the "Up next" lesson tile for a real interactive Google Maps view (display-only), using the web equivalent of the spec you provided. Everything else on the tile (blue date/time rail, pupil section, expanded sheet) stays exactly as-is.

## Translation: native spec → web

The spec was written for `react-native-maps`, which does not run in this React/Vite app. The project already uses `@react-google-maps/api` (see `GoogleMapPreview.tsx`, `FleetLiveMap.tsx`) with a shared loader at `src/lib/googleMapsLoader.ts`. The same constraints (gestures off, no UI chrome, custom style, single red pin, overlay pills) translate cleanly.

| Native spec | Web equivalent |
|---|---|
| `MapView provider={PROVIDER_GOOGLE}` | `<GoogleMap>` from `@react-google-maps/api` |
| `customMapStyle={dsmMapStyle}` | `options.styles = dsmMapStyle` |
| All `*Enabled={false}` + hidden chrome | `gestureHandling: "none"`, `disableDefaultUI: true`, `clickableIcons: false`, `keyboardShortcuts: false` |
| `liteMode` (Android only) | not applicable on web — gestures-off achieves the same static feel |
| `<Marker><DSMPin/></Marker>` | `<OverlayViewF>` with the SVG pin (lets us render the exact teardrop, not a default Google pin) |
| `tracksViewChanges={false}` | N/A (web markers don't redraw per frame) |
| Fallback `View` when coords missing | identical fallback `<div>` block |

## Files

**New**
- `src/components/instructor/upNext/dsmMapStyle.ts` — exports `dsmMapStyle` array exactly as in the spec.
- `src/components/instructor/upNext/DSMPin.tsx` — inline SVG (red teardrop, white inner circle, soft shadow ellipse) — no react-native-svg.
- `src/components/instructor/upNext/MapHeroLive.tsx` — the new interactive map hero.

**Edited**
- `src/components/instructor/MobileHomeRedesign.tsx` — replace the single `<MapHeroStatic ... />` usage inside the `UpNextTile` map slot with `<MapHeroLive ... />`. No other changes to the tile.

**Untouched**
- `MapHeroStatic.tsx` stays in the repo (still used elsewhere if referenced; we only swap the Up Next tile).
- Blue date/time rail, pupil name row, action buttons, expanded sheet, weather/traffic strip, all other screens.

## MapHeroLive behavior

- Height fixed at **140px**, `overflow: hidden`, `position: relative` wrapper — same dimensions as today.
- Loads Google Maps via the existing `loadGoogleMaps(await fetchGoogleMapsKey())` helper. While loading, render a neutral `#F0F3F8` placeholder at 140px (no spinner flash — keeps it calm).
- Geocodes the pickup using the existing `geocode-postcode` edge function (same pattern as `GoogleMapPreview`). Result memoised by postcode so revisits are instant.
- `<GoogleMap>` options:
  - `center` = pickup lat/lng, `zoom` = 15
  - `disableDefaultUI: true`, `gestureHandling: "none"`, `clickableIcons: false`, `keyboardShortcuts: false`, `draggable: false`, `scrollwheel: false`, `disableDoubleClickZoom: true`
  - `styles: dsmMapStyle`
- Single marker rendered via `OverlayViewF` (anchor bottom-center) using `DSMPin`.
- Region object built with `useMemo` keyed on `lesson.id` (per spec performance rule).
- Component wrapped in `React.memo` so unrelated home-screen state changes don't re-render it.
- Defer mount until visible: use `IntersectionObserver` on the wrapper; only mount `<GoogleMap>` once `isIntersecting` true (mirrors the spec's "shouldRenderMap" rule). Before that, show the neutral placeholder.

## Overlay pills (absolutely positioned over the map)

All three pills are pure CSS divs, positioned inside the 140px wrapper:

- **PulsingPill** — `top:10 left:10`, white 95% bg, radius 20, "In {minutesUntil} mins". Red 6px dot with a CSS keyframes pulse (opacity 1 ↔ 0.3, 1.2s loop). If `minutesUntil` not provided/<=0, hide the pill.
- **TimeCard** — `bottom:10 right:10`, radius 12, two-line: 22px bold time, 10px muted "Today" / day label.
- **ExpandPill** — `bottom:10 left:10`, radius 20, "Details" + chevron that rotates 180° on `expanded` via CSS transition. Calls the existing expand toggle already wired on the tile.

These reuse the props already passed to the current `MapHeroStatic` (`countdown`, `startTime`, `whenLabel`) — no new data plumbing needed.

## Fallback

When pickup coords resolve to `null` (geocode fails, or no postcode on the lesson), render at `height:140`:

```text
[ light grey panel #F0F3F8 ]
   "Location unavailable"   (12px #8E8E93)
   {pickupPostcode}         (13px 600 #1A52A0)
```

Identical to the spec's fallback block.

## Hard constraints honoured

- No new packages — uses already-installed `@react-google-maps/api` and the shared loader.
- No map gestures, no Google UI chrome, no toolbar/compass/my-location.
- No directions, search, or geocoding beyond the existing `geocode-postcode` call already used elsewhere.
- No new lesson data fields — binds to existing `pickupPostcode` (and lat/lng if the lesson already exposes them; otherwise geocoded from postcode like today's `MapHeroStatic`).
- Tile height stays 140; collapsed tile layout, blue rail, pupil avatar, detail rows, action buttons, and every other screen remain untouched.

## Out of scope

- The `react-native-maps` / Capacitor native build path. If you also want this in a native iOS/Android wrapper later, that's a separate task with its own native dependencies.
