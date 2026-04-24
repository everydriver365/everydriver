

## Fix: Use Google Maps on Next Lesson card

The "Next Up" card on the instructor mobile home (`IOSNativeHomeView.tsx`) currently renders `PostcodeMapPreview`, which is a **Leaflet/OpenStreetMap** component — not Google Maps. The project already has a working `GoogleMapPreview` component (used elsewhere) that:

- Loads the Google Maps JS SDK via `loadGoogleMaps()` + `fetchGoogleMapsKey()`
- Geocodes the pickup postcode
- Shows pickup marker + your live location + driving route polyline
- Tap-to-expand into a full-screen interactive map with "Open in Google Maps" button

### Change

**Edit** `src/components/instructor/IOSNativeHomeView.tsx`
- Replace import:
  - Remove `import { PostcodeMapPreview } from "@/components/instructor/PostcodeMapPreview"`
  - Add `import { GoogleMapPreview } from "@/components/instructor/GoogleMapPreview"`
- Replace the usage at line ~248:
  - From: `<PostcodeMapPreview postcode={nextLesson.pickupPostcode} />`
  - To: `<GoogleMapPreview postcode={nextLesson.pickupPostcode} address={nextLesson.pickupLocation ?? null} height={140} className="rounded-2xl overflow-hidden border" />`

### What you'll get
- Real Google Maps tiles (not OSM)
- Live driving route from your current location to the pupil's pickup
- Tap the map to open a full-screen interactive view with an "Open in Google Maps" deep-link button

### What stays the same
- All existing card data, ETA, traffic logic, and layout
- `PostcodeMapPreview` itself is left in place (still used elsewhere)
- No backend, route, or schema changes

### Out of scope
- Other surfaces still using Leaflet (will continue to work as-is)
- Map styling beyond the existing `GoogleMapPreview` defaults

