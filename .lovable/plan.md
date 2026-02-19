

# Force Google Maps Everywhere -- Replace All Leaflet/OSRM with Google Maps + Roads API

## Overview
Replace **MiniLiveMap** (Leaflet) and **FleetLiveMap** (Leaflet + OSRM) with Google Maps JavaScript API. All map rendering will use Google Maps. All road-snapping will go through the existing `snap-to-road` edge function (Google Roads API). No Leaflet, no OpenStreetMap, no OSRM anywhere in tracking.

## Changes

### 1. Rewrite `src/components/instructor/tracking/MiniLiveMap.tsx`
Replace Leaflet with Google Maps:
- Fetch API key from `get-google-maps-key` edge function (same pattern as `GoogleLiveTrackingMap`)
- Render a Google Map in the 200px container
- Show a colored circle marker (blue if active, gray if not)
- Keep the Live/Last seen badge overlay
- Remove all Leaflet imports and `useInterpolatedPosition` hook usage (interpolation is not needed for a small preview map)

### 2. Rewrite `src/components/instructor/FleetLiveMap.tsx`
Replace Leaflet + OSRM with Google Maps + snap-to-road:
- Fetch API key from `get-google-maps-key` edge function
- Render Google Map with all fleet device markers
- Markers: colored circles (green=moving, amber=idle, gray=parked) using `google.maps.SymbolPath.CIRCLE`
- InfoWindows replacing Leaflet popups (vehicle name, speed in mph, road name, ignition status, last seen, Navigate link)
- Realtime subscription on `gps_devices` table for instant marker updates
- Every 10 seconds: poll `gps_devices` for all instructor devices
- Interpolation loop (200ms): walk markers between positions using bearing-based movement (no OSRM, since fleet doesn't need route polylines -- just smooth marker movement)
- Auto-fit bounds to show all devices
- Remove all Leaflet imports and OSRM references

### 3. Update `src/hooks/useInterpolatedPosition.ts`
- Remove all OSRM (`fetchOsrmRoute`) code and exports
- Keep only bearing-based utilities (`haversineKm`, `moveAlongBearing`) since they're lightweight math functions
- Or remove the hook entirely if MiniLiveMap no longer uses it (FleetLiveMap will have its own inline interpolation)

### 4. No changes needed to:
- `GoogleLiveTrackingMap.tsx` -- already uses Google Maps
- `snap-to-road` edge function -- already uses Google Roads API
- `get-google-maps-key` edge function -- already serves the API key
- `InstructorLiveSession.tsx` -- already imports `GoogleLiveTrackingMap`
- `InstructorFleetDashboard.tsx` -- import stays the same (`FleetLiveMap`)

## What Gets Removed
- All `leaflet` and `react-leaflet` imports from MiniLiveMap and FleetLiveMap
- All OSRM calls (`router.project-osrm.org`)
- `mapConfig.ts` usage in these two components (tile URLs, attribution)
- `useInterpolatedPosition` hook (or stripped to just math utilities)

## Technical Details

**Shared Google Maps loader**: Both new components will reuse the same `loadGoogleMaps()` and `fetchGoogleMapsKey()` pattern already in `GoogleLiveTrackingMap.tsx`. These will be extracted to a shared utility file `src/lib/googleMapsLoader.ts` to avoid duplication.

**MiniLiveMap specifics**:
- Small 200px map, no controls, no dragging (same as current)
- Single marker with heading rotation
- Auto-centers on position changes

**FleetLiveMap specifics**:
- Full interactive map with zoom controls
- Multiple markers with InfoWindows
- `fitBounds` to show all devices
- Realtime subscription for live updates
- 200ms interpolation loop for smooth marker movement between GPS updates (bearing-based, no external API calls)

**API key flow**: `get-google-maps-key` edge function returns `GOOGLE_PLACES_API_KEY` -- this key must have Maps JavaScript API enabled in Google Cloud Console.

