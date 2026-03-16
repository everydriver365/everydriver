

# Find Nearby — Quick Action Tile & Page

## What
Add a "Find Nearby" tile to the instructor quick actions that opens a dedicated page where instructors can find the nearest public toilet, McDonald's, petrol station, A&E unit, and defibrillator — all using Google Places API (already configured via the `get-google-maps-key` edge function).

## Implementation

### 1. New Page: `src/pages/InstructorFindNearby.tsx`
- Page with 5 category cards in a grid: Toilets, McDonald's, Petrol Station, A&E, Defib
- Tapping a category uses `navigator.geolocation` to get current position, then calls Google Places Nearby Search via a new edge function
- Results shown as a sorted-by-distance list with: name, distance, address, open/closed badge, and a "Navigate" button (opens Google Maps directions)
- Follows the same layout pattern as `InstructorFuel.tsx` (InstructorPortalLayout, back button, category filter)

### 2. New Edge Function: `supabase/functions/google-places-nearby/index.ts`
- Accepts `{ lat, lng, type, keyword }` — calls Google Places Nearby Search API with the existing `GOOGLE_PLACES_API_KEY` secret
- Category mapping: Toilets → `keyword:"public toilet"`, McDonald's → `keyword:"McDonalds"`, Petrol → `type:"gas_station"`, A&E → `keyword:"accident emergency hospital"`, Defib → `keyword:"defibrillator"`
- Returns `{ places: [{ name, address, lat, lng, distance, open_now, rating }] }`
- Requires auth (Bearer token check)

### 3. Add Tile to Quick Actions
- Add entry to `additionalTiles` in `QuickActionTiles.tsx` with id `"find-nearby"`, route `/instructor/find-nearby`
- Add to `customIconImages` mapping (create or use a suitable icon asset, or fall back to lucide `Search` icon)
- Add subtitle in `getSubtitle`: "Toilets, food & more"

### 4. Route Registration
- Add route in `App.tsx`: `/instructor/find-nearby` → `InstructorFindNearby`

### Files
- **New**: `src/pages/InstructorFindNearby.tsx`, `supabase/functions/google-places-nearby/index.ts`
- **Edit**: `src/App.tsx` (add route), `src/components/instructor/QuickActionTiles.tsx` (add tile)

