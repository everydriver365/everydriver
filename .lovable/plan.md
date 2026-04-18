
The console shows `Google Maps JavaScript API error: ApiProjectMapError`. The `GoogleMapPreview` component uses `useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY })` — but there is no `VITE_GOOGLE_MAPS_API_KEY` in `.env` (only Supabase vars are auto-injected). So the loader is being called with an empty string, hence the API project error.

Meanwhile, the project already has a proper pattern: `GOOGLE_PLACES_API_KEY` is stored as a server-side secret, exposed via the `get-google-maps-key` edge function, and loaded via `fetchGoogleMapsKey()` in `src/lib/googleMapsLoader.ts`. `NearbyFriendsMap.tsx` has the same bug, but scope here is the Next Lesson tile.

## Fix

Rewrite `src/components/instructor/GoogleMapPreview.tsx` to:
1. Fetch the key on mount via `fetchGoogleMapsKey()` instead of reading `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`.
2. Pass the resolved key into `useJsApiLoader` (only after it's loaded — gate rendering on both key + isLoaded).
3. Keep all existing behaviour (preview map, expand dialog, light roadmap style, geocode via `geocode-postcode`).
4. Also add `aria-describedby={undefined}` or a `DialogDescription` to silence the a11y warning.

No backend changes — `GOOGLE_PLACES_API_KEY` secret and `get-google-maps-key` function already exist and work.

## Note
The same `VITE_GOOGLE_MAPS_API_KEY` bug exists in `NearbyFriendsMap.tsx`. Out of scope for this request, but I'll mention it.
