## Goal

Change the mobile **Quick Access** grid on the instructor home (`/instructor`) so it shows exactly **2 rows of tiles per page** instead of the current 3 rows.

## Current behaviour

`src/components/instructor/quickAccess/QuickAccessSwipeablePaged.tsx` renders a horizontally-swipeable, paged grid:

- 2 columns × 3 rows = **6 tiles per page**
- Pages dots underneath
- Search results override into a single (non-paged) 2-column grid

## Proposed change

Reduce each page to **2 rows**. Two reasonable shapes — please pick one:

### Option A — 2 cols × 2 rows (4 tiles per page) — recommended

Keeps the existing larger, label + subtitle "rich" tile look. More pages, fewer tiles per swipe.

```text
[ Tile ] [ Tile ]
[ Tile ] [ Tile ]
   • • • • • •
```

Change: `TILES_PER_PAGE = 6` → `4`. Grid columns stay at 2.

### Option B — 3 cols × 2 rows (6 tiles per page, denser)

Same total tiles per page as today, but reshaped to 2 rows so everything is visible without scrolling within the page. Tiles get smaller; subtitle may need to be hidden on the narrower cell.

```text
[ T ] [ T ] [ T ]
[ T ] [ T ] [ T ]
   • • • •
```

Change: `gridTemplateColumns` → `repeat(3, ...)`, `TILES_PER_PAGE` stays 6, and `RichTileCard` gets a compact variant (icon + title only) when used in 3-col mode.

## Files to edit

- `src/components/instructor/quickAccess/QuickAccessSwipeablePaged.tsx` — page size + grid columns (both the paged scroller and the search-results grid stay aligned).
- `src/components/instructor/quickAccess/QuickAccessTiles.tsx` (only for **Option B**) — add a `compact` prop to `RichTileCard` to drop the subtitle and tighten padding so 3 fit comfortably at 390 px.

## Out of scope

- No changes to the tile registry, customise sheet, search behaviour, or any other home section.
- Desktop / non-mobile layouts unchanged (this component is only used in the mobile home).
- No mobile layout changes elsewhere (per project rule).

Reply with **A** or **B** (or describe a different shape) and I'll implement.
