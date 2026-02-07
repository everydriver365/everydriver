

# Map Annotation Tool (Doodlepad)

A new interactive tool that lets instructors view their current location on a map, then draw lines, arrows, and annotations directly on it to illustrate vehicle direction of travel, road positioning, and other teaching points.

## What It Does

- **Shows your current location** on a live map using your phone's GPS (no Google Maps needed -- uses the same mapping system already in the app)
- **Draw on the map** with your finger or mouse -- lines, arrows, circles, and text
- **Annotations stay pinned** to real-world locations, so when you pan or zoom, your drawings move with the map
- **Save and reload** your drawings for reuse in future lessons (e.g., "Roundabout approach", "Parallel parking steps")
- **Undo/redo** support for easy editing

## How It Works

1. Open the Doodlepad from the instructor menu
2. The map centres on your current GPS position
3. Tap the pencil icon to start drawing -- select colour, tool type (freehand, arrow, circle, text)
4. Draw directly on the map to show students vehicle paths, positioning, etc.
5. Save your annotation with a name for later use

## Technical Details

### New Files
- `src/pages/InstructorDoodlepad.tsx` -- Page wrapper with geolocation initialisation
- `src/components/instructor/doodlepad/DoodlepadMap.tsx` -- Full-screen Leaflet map with canvas overlay
- `src/components/instructor/doodlepad/DoodlepadToolbar.tsx` -- Floating toolbar (tool selection, colour picker, undo/redo, save/load)
- `src/components/instructor/doodlepad/DoodlepadCanvas.tsx` -- HTML5 Canvas overlay that converts screen coordinates to lat/lng for geo-anchored drawing
- `src/components/instructor/doodlepad/SavedAnnotationsDrawer.tsx` -- Bottom drawer listing saved doodlepads from the database

### Database
- New `doodlepads` table:
  - `id` (UUID, primary key)
  - `instructor_id` (UUID, references auth user)
  - `name` (text)
  - `center_lat`, `center_lng` (float8 -- map centre when saved)
  - `zoom_level` (integer)
  - `annotations` (JSONB -- array of drawing objects with lat/lng anchors)
  - `created_at`, `updated_at` (timestamps)
  - RLS policies restricting access to the owning instructor

### Drawing Architecture
- Canvas overlay sits on top of the Leaflet map, sized to the viewport
- Each drawing stroke records lat/lng anchor points (converted from pixel coordinates using Leaflet's `containerPointToLatLng`)
- On map pan/zoom, all strokes are re-projected from lat/lng back to screen pixels using `latLngToContainerPoint` and redrawn
- Tools: Freehand pen, straight line, arrow, circle, text label
- Colours: Red, blue, green, black, white (with thickness options)

### Navigation Integration
- New route: `/instructor/doodlepad`
- Added to instructor menu, bottom nav, and command palette
- Uses existing `mapConfig.ts` for consistent tile styling

### Geolocation
- Uses the browser's `navigator.geolocation.getCurrentPosition()` (same approach as existing tracking features)
- Falls back to UK centre coordinates if permission denied
