
## Problem

`@react-google-maps/api`'s `useJsApiLoader` is a singleton — once called with one apiKey it cannot be re-called with a different one. Our `GoogleMapPreview` first renders with `apiKey=""` (before fetch resolves) and then with the real key → crash. Other components (e.g. `NearbyFriendsMap`) also call `useJsApiLoader` with `import.meta.env.VITE_GOOGLE_MAPS_API_KEY` (empty), which conflicts further.

## Fix

Bypass `useJsApiLoader` in `GoogleMapPreview` and use the existing `loadGoogleMaps(apiKey)` helper from `src/lib/googleMapsLoader.ts`, which is idempotent and key-stable.

Steps in `src/components/instructor/GoogleMapPreview.tsx`:
1. Remove `useJsApiLoader` import.
2. On mount: `fetchGoogleMapsKey()` → then `loadGoogleMaps(key)` → set `isLoaded=true`.
3. Don't render `<GoogleMap>` until both key fetched and script loaded.
4. Keep all other behaviour (preview, dialog, geocode, light roadmap).

Also fix `src/components/instructor/NearbyFriendsMap.tsx` the same way (it uses the missing env var and contributes to the loader conflict). Replace `useJsApiLoader` with the same `fetchGoogleMapsKey` + `loadGoogleMaps` pattern.

No backend changes.
