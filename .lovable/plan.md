

## Plan: Switch LessonRouteRecorder Map from Leaflet to Google Maps

### What changes

Replace the Leaflet `MapContainer` in `LessonRouteRecorder.tsx` with Google Maps, matching the pattern already used in `MiniLiveMap.tsx`.

### File: `src/components/instructor/LessonRouteRecorder.tsx`

1. Remove Leaflet imports (`MapContainer`, `TileLayer`, `Polyline`, `CircleMarker`, `leaflet.css`, `mapConfig`)
2. Import `fetchGoogleMapsKey` and `loadGoogleMaps` from `@/lib/googleMapsLoader.ts`
3. Add a `useEffect` to load the Google Maps SDK (same pattern as `MiniLiveMap.tsx`)
4. Use a `div` ref for the map container
5. Initialise `google.maps.Map` when recording starts and SDK is ready — zoom 15, no UI controls, roadmap type
6. Draw route with `google.maps.Polyline` (blue, weight 4)
7. Green `CircleMarker` at start point → green circle `google.maps.Marker` with SVG symbol
8. Current position → blue arrow marker (same `getArrowIcon` pattern from MiniLiveMap)
9. Auto-pan to latest position as coordinates update
10. Clean up map instance when recording stops

No other files changed.

