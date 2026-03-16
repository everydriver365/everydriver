

# Fix: Make "Find Nearby" Tile Visible by Default

## Root Cause
`additionalTiles` in `AppStyleHomeView.tsx` are **not shown by default**. The `getOrderedTiles` function in `useInstructorTilePreferences.ts` only displays `globalTiles` (from the database) when no custom order is saved. Additional tiles only appear if an instructor has explicitly added them to their saved `tileOrder`.

## Fix Options

**Option A (Recommended):** Move "find-nearby" from `additionalTiles` into the database `quick_actions` JSON so it's a default tile for all instructors.

**Option B:** Change the `getOrderedTiles` logic to include certain additional tiles by default — but this would affect all additional tiles and break the current design intent.

## Plan — Option A
1. Update the `instructor_homepage_content` table's `quick_actions` JSON to include the "find-nearby" entry with appropriate display_order
2. This is a single database update — no code changes needed

## Database Migration
```sql
UPDATE instructor_homepage_content
SET quick_actions = quick_actions || '[{"id": "find-nearby", "title": "Find Nearby", "icon": "MapPin", "route": "/instructor/find-nearby", "display_order": 114.5}]'::jsonb
WHERE is_active = true;
```

