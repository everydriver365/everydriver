

## Plan: Switch MiniLiveMap to Google Maps

### Why Leaflet was used
The previous fix swapped to Leaflet because the map wasn't rendering. The actual issue was likely the Google Maps SDK not being loaded/initialised in that component — the API key exists and works (used elsewhere via `get-google-maps-key` edge function).

### What to change

**File: `src/components/instructor/tracking/MiniLiveMap.tsx`**

1. Remove Leaflet imports (`L`, leaflet CSS)
2. Use the existing `fetchGoogleMapsKey` and `loadGoogleMaps` helpers from `@/lib/googleMapsLoader.ts` to load the SDK
3. Initialise a `google.maps.Map` in the div ref with the same options (no zoom control, no interaction on the mini map)
4. Use a `google.maps.Marker` (or `AdvancedMarkerElement`) with a coloured circle icon matching current behaviour (blue when active, grey when inactive)
5. Keep the same overlay badges (Live / Last seen) positioned absolutely over the map
6. Pan to new position when `latitude`/`longitude` props change
7. Show "No position data yet" overlay when no coordinates available

### Technical notes
- `fetchGoogleMapsKey()` calls the `get-google-maps-key` edge function (requires auth) — handle the async load in a `useEffect`
- `loadGoogleMaps(key)` is idempotent — safe to call multiple times
- Map style: `roadmap` type, zoom 16, all controls disabled for the mini preview
- No other files need changing

