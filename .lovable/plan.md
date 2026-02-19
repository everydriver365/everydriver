

# Integrate Pasted LiveGoogleTrackingMap Code

## Overview
Replace the current `GoogleLiveTrackingMap` (prop-driven) with the user's pasted self-contained component that fetches its own device data, subscribes to realtime, and renders speed/limit/road/last-updated info cards. Also ensure MiniLiveMap and FleetLiveMap remain on Google Maps (already migrated).

## Changes

### 1. Rewrite `src/components/instructor/GoogleLiveTrackingMap.tsx`
Adopt the pasted code with these project-specific adaptations:
- Use the existing shared `supabase` client from `@/integrations/supabase/client` instead of creating a new one
- Use `fetchGoogleMapsKey()` from `src/lib/googleMapsLoader.ts` (fetches key via `get-google-maps-key` edge function) instead of requiring `VITE_GOOGLE_MAPS_API_KEY` env var
- Use `callSnapToRoad()` from `src/lib/googleMapsLoader.ts` instead of inline snap-to-road call
- Keep all the pasted logic: self-contained device fetch, realtime subscription on `gps_devices`, 5-second route polling, snap-to-road polyline, InfoCard UI (speed, limit, road name, last updated), unit toggle (mph/kmh), overspeed indicator
- Export as default `LiveGoogleTrackingMap`

### 2. Update `src/pages/InstructorLiveSession.tsx`
- The component is now self-contained (fetches its own device), so remove the props being passed to it (`latitude`, `longitude`, `heading`, `speedKmh`, `speedLimitKmh`, `isConnected`, `sessionId`, `roadName`, `className`)
- Simply render `<LiveGoogleTrackingMap />` with no props (or just a className for sizing)
- The parent page may still need its own device data for other UI elements (session timer, alerts, etc.) -- keep that logic intact

### 3. No changes needed to:
- `src/lib/googleMapsLoader.ts` -- already has `loadGoogleMaps`, `fetchGoogleMapsKey`, `callSnapToRoad`
- `supabase/functions/snap-to-road/index.ts` -- already deployed
- `supabase/functions/get-google-maps-key/index.ts` -- already deployed
- `MiniLiveMap.tsx` -- already on Google Maps
- `FleetLiveMap.tsx` -- already on Google Maps

## Technical Details

### Key differences from pasted code vs project adaptation:
| Pasted code | Project adaptation |
|---|---|
| `createClient(url, key)` inline | Use shared `supabase` from `@/integrations/supabase/client` |
| `VITE_GOOGLE_MAPS_API_KEY` env var | `fetchGoogleMapsKey()` via edge function |
| Inline `callSnapToRoad()` with URL params | Shared `callSnapToRoad()` from `googleMapsLoader.ts` |
| Raw HTML/inline styles for cards | Tailwind CSS + shadcn/ui components to match project style |

### Self-contained data flow:
1. Component mounts, fetches user's active `gps_devices` row
2. Subscribes to realtime changes on that device row
3. Initializes Google Map with device position
4. Every 5 seconds: fetches `telematics_gps_points`, calls snap-to-road, draws polyline
5. Renders InfoCards: speed, speed limit, road name, last updated, overspeed badge, unit toggle

