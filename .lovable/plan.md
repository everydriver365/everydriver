

## Migrate Jotter from Leaflet to Google Maps

You already have this feature built — the **Jotter** (at `/instructor/doodlepad`) lets instructors draw on a map and save annotations. It currently uses Leaflet/OpenStreetMap tiles, but the rest of your platform has been standardized on Google Maps. Here's the plan to migrate it.

### What changes

1. **Replace `DoodlepadMap.tsx`** — swap out the Leaflet `MapContainer`/`TileLayer` for a vanilla Google Maps instance (same pattern used in `FleetLiveMap` and `MiniLiveMap`), loading the API key via the existing `fetchGoogleMapsKey` + `loadGoogleMaps` helpers.

2. **Replace `DoodlepadCanvas.tsx`** — remove Leaflet's `useMap` dependency. Instead, attach the HTML5 Canvas overlay to the Google Maps container div and use `google.maps.Map.getProjection()` / `fromLatLngToPoint()` for geo↔pixel conversions. Re-bindraw event handlers and live preview logic to the new coordinate system.

3. **Remove Leaflet imports** from the doodlepad folder — no more `react-leaflet`, `leaflet`, or `leaflet.css` imports in these files.

4. **No database or toolbar changes** — the annotation data model (JSONB with lat/lng points), the toolbar, the save/load drawer, and undo/redo logic all remain exactly the same.

### Technical approach

- **Map initialisation**: Create a `google.maps.Map` inside a ref'd div, with `gestureHandling: "greedy"` for smooth pan/zoom. Disable map dragging when in draw mode (same as current Leaflet approach).
- **Canvas overlay**: Position an absolutely-placed `<canvas>` over the map div. Use `google.maps.OverlayView` or manual pixel math via `map.getProjection()` + `map.getBounds()` to convert `LatLng → pixel` and back.
- **Event listeners**: `mousedown`/`mousemove`/`mouseup` + touch equivalents on the canvas, identical to current logic but using Google Maps projection for coordinate conversion.
- **Redraw on pan/zoom**: Listen to `idle`/`bounds_changed` events on the map to trigger canvas redraws, replacing Leaflet's `move`/`zoom` events.

### Files affected

| File | Action |
|------|--------|
| `src/components/instructor/doodlepad/DoodlepadMap.tsx` | Rewrite — Google Maps instead of Leaflet |
| `src/components/instructor/doodlepad/DoodlepadCanvas.tsx` | Rewrite — Google Maps projection instead of Leaflet |
| `src/components/instructor/doodlepad/types.ts` | No change |
| `src/components/instructor/doodlepad/DoodlepadToolbar.tsx` | No change |
| `src/components/instructor/doodlepad/SavedAnnotationsDrawer.tsx` | No change |
| `src/pages/InstructorDoodlepad.tsx` | No change |

