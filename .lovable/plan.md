## Goal

Show a small map preview inside the Driving test modal with pins for the top filtered test centres (and the pupil's postcode origin), so the instructor can see at a glance where they are relative to home.

## Scope

Single file: `src/components/instructor/DrivingTestQuickEdit.tsx`. Uses Leaflet + OpenStreetMap tiles — already installed in the project (`react-leaflet`, `leaflet`). No new deps, no API keys, no Google Maps connector setup needed.

## UX

- New compact map sits between the postcode/radius row and the centre dropdown.
- ~160px tall, full width of the modal, rounded-xl border, overflow-hidden.
- Renders only when:
  - The Test centre section is visible (status is booked/passed/failed), AND
  - The postcode has geocoded successfully (we have an origin).
- Markers:
  - **Origin** — small distinct pin (filled circle marker, primary colour) at the postcode location with a "Home" tooltip.
  - **Top 5** centres from `visibleCentres` (already sorted by distance) — default Leaflet markers, each with a tooltip `Name · X.X mi`.
  - Clicking a centre marker selects it (sets `centreId`), same as picking from the dropdown.
- Map auto-fits bounds to include the origin + visible markers on every change (postcode / radius / showAll).
- If `visibleCentres` is empty (e.g. very small radius, no nearby centres), show the origin alone with a small "No centres within {radius} mi" hint over the map.

## Technical

- Import `MapContainer`, `TileLayer`, `Marker`, `CircleMarker`, `Tooltip`, `useMap` from `react-leaflet`; `import "leaflet/dist/leaflet.css"` at top.
- OSM tile layer: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` with the standard attribution string.
- Fix the well-known Leaflet default-icon path issue by setting `L.Icon.Default.mergeOptions` with the CDN icon URLs (small inline block at module scope, guarded so it runs once).
- A tiny inner `<FitBounds>` component uses `useMap()` + `map.fitBounds(...)` in a `useEffect` keyed on the marker coordinates.
- Top-N is fixed at 5 to keep the preview readable.
- Render the map inside a fragment that only mounts when `origin` exists, so the Leaflet instance isn't created until needed.

## Out of scope

- Theory test centre modal.
- Drawing the radius circle on the map (could add later if requested).
- Routing / directions / drive-time overlay.
- Switching to Google Maps / Mapbox.
