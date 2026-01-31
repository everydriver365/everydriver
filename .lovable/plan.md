

# Plan: Instructor Tile Favorites (Show/Hide) Feature

## Overview
Enable instructors to personalize their mobile home page by adding/removing Quick Action tiles as favorites. Hidden tiles will be accessible in the Settings page, where instructors can re-add them. This extends the existing tile reordering system.

## Current State
- Quick Action tiles are defined globally in `instructor_homepage_content` table
- The `instructor_tile_preferences` table stores custom `tile_order` (array of tile IDs)
- Instructors can reorder tiles via drag-and-drop in `QuickActionTiles.tsx`
- The Settings page is organized into 6 categories with collapsible sections

## Proposed Changes

### Core Concept
- Extend `instructor_tile_preferences` to store a `hidden_tiles` array alongside `tile_order`
- In Edit mode on home page, add a "hide" action (X button) on each tile
- In Settings, add a new "Dashboard Layout" section showing hidden tiles that can be re-added

### User Experience

**On Home Page (Edit Mode):**
1. Tap "Edit" to enter edit mode
2. Each tile shows a small "X" button to hide it
3. Tapping X removes the tile from the home page
4. Tile is moved to "hidden" list in database
5. User can reorder remaining tiles as before
6. Tap "Done" to save

**In Settings Page:**
1. New section under "Preferences" category: "Dashboard Layout"
2. Shows list of hidden tiles with "Add back" button
3. Tapping "Add back" returns tile to home page
4. Optional: Show count of visible vs hidden tiles

### Visual Mockup

**Home Page Edit Mode:**
```
+------------------------------------------+
| Quick Actions                    [Done]  |
+------------------------------------------+
| [X] ≡ [Schedule] ≡                      |
| [X] ≡ [My Pupils] [X] ≡ [Job Offers]    |
| [X] ≡ [Payments]  [X] ≡ [Fill Gaps]     |
+------------------------------------------+
```
The [X] button appears in edit mode only.

**Settings - Dashboard Layout:**
```
+------------------------------------------+
| 🏠 Dashboard Layout                      |
| Customize your home screen tiles         |
+------------------------------------------+
| Hidden Tiles (2)                         |
|                                          |
| [Track Lesson     ] [+ Add to Home]     |
| [Expenses         ] [+ Add to Home]     |
+------------------------------------------+
```

---

## Technical Implementation

### 1. Database Schema Update

Extend `instructor_tile_preferences` with a new column:

```sql
ALTER TABLE public.instructor_tile_preferences 
ADD COLUMN hidden_tiles JSONB DEFAULT '[]'::jsonb;
```

**Updated Schema:**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| instructor_id | uuid | FK to instructors |
| tile_order | jsonb | Array of visible tile IDs in order |
| hidden_tiles | jsonb | Array of hidden tile IDs |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

### 2. Update Hook: useInstructorTilePreferences

Extend the existing hook to handle hidden tiles:

**New State:**
- `hiddenTiles: string[]` - List of hidden tile IDs

**New Functions:**
- `hideTile(tileId: string)` - Move tile to hidden list
- `showTile(tileId: string)` - Move tile back to visible list
- `getVisibleTiles(globalTiles)` - Filter out hidden tiles from ordered list
- `getHiddenTiles(globalTiles)` - Get only hidden tiles

**Updated Logic:**
```
getOrderedTiles() now:
1. Get all global tiles
2. Filter out any in hiddenTiles array
3. Apply custom ordering from tile_order
4. Return only visible tiles

getHiddenTiles() new:
1. Get all global tiles
2. Return only those in hiddenTiles array
```

### 3. Update QuickActionTiles Component

**Changes to Edit Mode:**
- Add a remove/hide button (X icon) on each tile
- When clicked, call `hideTile(action.id)`
- Remove tile from local state immediately for responsive UX
- Tile animates out with framer-motion `exit` animation

**Updated Edit Mode Tile:**
```tsx
<Reorder.Item key={action.id} value={action}>
  <motion.div className="...">
    {/* Remove button - top right corner */}
    <button 
      onClick={(e) => { 
        e.stopPropagation(); 
        handleHideTile(action.id); 
      }}
      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive..."
    >
      <X className="h-3 w-3 text-white" />
    </button>
    
    <GripVertical className="..." />
    {/* Rest of tile content */}
  </motion.div>
</Reorder.Item>
```

### 4. Create New Settings Component: DashboardLayoutManager

**File:** `src/components/instructor/DashboardLayoutManager.tsx`

**Features:**
- Shows list of hidden tiles
- Each hidden tile has "Add to Home" button
- When clicked, calls `showTile(tileId)`
- Provides visual feedback (tile disappears from list)
- Empty state: "All tiles are visible on your dashboard"

**Component Structure:**
```tsx
function DashboardLayoutManager({ instructorId }: Props) {
  const { getHiddenTiles, showTile, loading } = useInstructorTilePreferences(instructorId);
  const { content } = useInstructorHomepageContent();
  
  const hiddenTiles = getHiddenTiles(content?.quick_actions || []);
  
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Manage which tiles appear on your dashboard home screen.
      </p>
      
      {hiddenTiles.length === 0 ? (
        <p className="text-center text-muted-foreground">
          All tiles are visible on your dashboard
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium">Hidden Tiles</p>
          {hiddenTiles.map(tile => (
            <div key={tile.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <TileIcon icon={tile.icon} />
                <span>{tile.title}</span>
              </div>
              <Button size="sm" onClick={() => showTile(tile.id)}>
                <Plus className="h-4 w-4 mr-1" />
                Add to Home
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 5. Update Settings Page

Add new `DashboardLayoutManager` to the Preferences category:

```tsx
<SettingsTile 
  id="dashboard-layout" 
  icon={Layout} 
  title="Dashboard Layout" 
  description="Customize your home screen tiles"
  iconColor="text-indigo-600"
  iconBg="bg-indigo-100 dark:bg-indigo-900/30"
>
  <DashboardLayoutManager instructorId={instructorId} />
</SettingsTile>
```

---

## Files to Create

1. **`src/components/instructor/DashboardLayoutManager.tsx`**
   - New component for managing hidden tiles in Settings
   - Displays hidden tiles with "Add to Home" functionality

## Files to Modify

1. **`src/hooks/useInstructorTilePreferences.ts`**
   - Add `hiddenTiles` state
   - Add `hideTile()` and `showTile()` functions
   - Add `getHiddenTiles()` function
   - Update `getOrderedTiles()` to exclude hidden tiles
   - Update `saveTileOrder()` to also save hidden tiles

2. **`src/components/instructor/QuickActionTiles.tsx`**
   - Add hide button (X) to edit mode tiles
   - Handle `hideTile()` action with animation
   - Update local state on hide for immediate feedback

3. **`src/pages/InstructorSettings.tsx`**
   - Import and add `DashboardLayoutManager` component
   - Place in Preferences category

## Database Migration

```sql
-- Add hidden_tiles column to instructor_tile_preferences
ALTER TABLE public.instructor_tile_preferences 
ADD COLUMN IF NOT EXISTS hidden_tiles JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.instructor_tile_preferences.hidden_tiles 
IS 'Array of tile IDs that the instructor has hidden from their dashboard';
```

---

## Edge Cases Handled

1. **Admin adds new tile** - New tiles appear on home page (not in hidden list) since they weren't explicitly hidden
2. **Admin removes a tile** - Tile removed from both tile_order and hidden_tiles on next fetch
3. **No preferences saved** - All tiles visible with default order
4. **All tiles hidden** - Show "Add tiles from Settings" message on home page

## Implementation Order

1. Database migration (add `hidden_tiles` column)
2. Update `useInstructorTilePreferences` hook
3. Update `QuickActionTiles` with hide button
4. Create `DashboardLayoutManager` component
5. Add to Settings page

