

## Remove Expenses Tile from Home Screen

This change will move the Expenses tile from the default home screen to the "Add Tiles" section, where you can add it back anytime if you want it.

### Changes

**1. Update Database** - Remove "expenses" from the default tiles list in `instructor_homepage_content.quick_actions`

**2. Update Code** - Add "expenses" to the optional tiles registry in `QuickActionTiles.tsx` so it appears in the "Add Tiles" section

### Result
- Expenses will no longer appear on the home screen by default
- It will be available in the "Add Tiles" menu during Edit mode if you want to add it back later

