

## Plan: Quick Actions search

Add a small search input above the Quick Actions carousel on the instructor home that filters the 32 tiles in place. When the user types, the carousel hides and a single filtered grid takes its place. Clearing the input restores the carousel and pagination dots.

### Behaviour

- Search input sits directly above the carousel, inside the same Quick Actions section.
- iOS-style appearance, matching the existing `IOSSearchBar` component already in the codebase (rounded, muted background, clear button, Cancel affordance).
- Filtering matches against tile `title` and `subtitle` (case-insensitive, substring).
- While the query is empty: render the existing swipeable carousel + pagination dots unchanged.
- While the query is non-empty:
  - Hide the carousel and dots.
  - Render matching tiles in the same 2-column grid the carousel uses, with the same `WarmTile` styling, locked-state handling (`TILE_FEATURE_MAP`), and navigation behaviour.
  - If no matches: show a small muted "No actions match '…'" line.
- Locked tiles still show the lock icon and the existing upgrade toast on tap.
- `primary` styling on "Track lesson" is preserved.

### Files to edit

- `src/components/instructor/SwipeableQuickAccess.tsx`
  - Add local `query` state.
  - Import and render `IOSSearchBar` from `@/components/ui/IOSSearchBar` above the carousel, with the same horizontal padding (`px-4`) the grid uses.
  - Extract the tile-render logic (the inner `WarmTile` + locked wrapper) into a small local helper so it can be reused by both the carousel pages and the filtered grid.
  - When `query.trim().length > 0`: render the filtered grid instead of the carousel/dots.

No other files change. No new dependencies. No backend changes.

### QA at 390px on `/instructor`

- Search input renders flush with the existing section padding, above the tile carousel.
- Typing "track" shows only "Track lesson" (with red primary outline preserved).
- Typing "gap" shows "Fill gaps".
- Clearing the input restores the carousel at page 1 with dots visible.
- Locked tile (e.g. "Take payment" on free tier) still shows lock + triggers upgrade toast when tapped from search results.
- Cancel button on the search bar clears the query and blurs the input.

