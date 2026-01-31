
# Plan: Instructor Tile Rearrangement Feature

## Overview
Add the ability for instructors to personalize their mobile home page by dragging and dropping Quick Action tiles to reorder them. The custom order will be saved to the database and persist across sessions.

## Current State
- Quick Action tiles are defined globally in the `instructor_homepage_content` table as a JSON array
- All instructors see the same tile order (set by admin via `InstructorHomepageManager`)
- The project already uses `framer-motion` which has built-in `Reorder` components for drag-and-drop

## Implementation Approach

### 1. Database: Store Instructor Preferences
Create a new table to store each instructor's personal tile order preferences:

**New Table: `instructor_tile_preferences`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| instructor_id | uuid | Foreign key to instructors (unique) |
| tile_order | jsonb | Array of tile IDs in custom order |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

**RLS Policies:**
- Instructors can read/update only their own preferences
- Insert allowed for authenticated instructors

### 2. Custom Hook: Tile Preferences
Create a new hook `useInstructorTilePreferences` that:
- Fetches the instructor's saved tile order
- Merges custom order with admin-defined tiles (handles new tiles added by admin)
- Provides a `saveOrder` function to persist changes
- Falls back to default order if no preferences saved

### 3. Mobile Home Page: Drag-and-Drop UI
Update `InstructorMobileHome.tsx` to:
- Add an "Edit Layout" toggle button
- When in edit mode, wrap tiles with `Reorder.Group` and `Reorder.Item` from framer-motion
- Show drag handles on tiles
- Add "Done" button to save and exit edit mode
- Tiles animate smoothly during drag operations

### 4. User Experience
- Tap "Edit Layout" icon (grid/reorder icon) in the quick actions header
- Tiles gain a subtle shake animation and drag handles appear
- Long-press or drag a tile to move it
- Tap "Done" to save the new order
- Changes persist immediately to database

---

## Technical Details

### Files to Create
1. **`src/hooks/useInstructorTilePreferences.ts`**
   - Hook for fetching/saving instructor's tile preferences
   - Handles merging with global tiles (admin may add new ones)

### Files to Modify
2. **`src/components/instructor/InstructorMobileHome.tsx`**
   - Add edit mode state and toggle UI
   - Replace static tile rendering with `Reorder.Group`/`Reorder.Item`
   - Add drag handles and save functionality

### Database Migration
3. **Create `instructor_tile_preferences` table**
   - Schema with proper RLS policies
   - Index on instructor_id for fast lookups

### Component Logic
```
Quick Actions Rendering Flow:
1. Fetch global tiles from instructor_homepage_content
2. Fetch instructor's custom order from instructor_tile_preferences
3. If custom order exists:
   - Reorder global tiles based on saved order
   - Append any new tiles not in saved order (admin added new ones)
4. If no custom order: use global display_order
5. In edit mode: enable drag-and-drop via Reorder components
6. On save: persist tile ID array to instructor_tile_preferences
```

### UI Mockup (Edit Mode)
```
+----------------------------------+
|  Quick Actions     [Edit ✎]     |
+----------------------------------+
|  ≡ [📅 View Schedule          ]  |
|  ≡ [👥 My Pupils] [💼 Job Offers]|
|  ≡ [💳 Payments] [⏰ Fill Gaps ] |
+----------------------------------+
|        [ Done Editing ]          |
+----------------------------------+
```
The ≡ symbol represents the drag handle visible in edit mode.
