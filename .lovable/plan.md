

## Plan: Add more space under the Quick Actions tiles

The user perceives the bottom edge of the Quick Actions area as a "gradient border" — that's actually just the next section sitting too close. I'll add a clear gap below the bottom row of tiles (above the pagination dots) so the section feels properly contained.

### Change

In `src/components/instructor/SwipeableQuickAccess.tsx`:

- Add bottom padding inside each carousel page so there's clear space between the tile row and the pagination dots. Currently the pages render tiles with no bottom padding and the dots sit at `mt-8` from the carousel — but the carousel itself ends flush with the tiles, which makes the dots feel attached to the bottom row.
- Specifically, wrap the tile grid with `paddingBottom: 16` (or use `pb-4`) so each page has internal breathing room below the second row of tiles.
- Keep `mt-8` on the dots container (already set), so total gap from tile row → dots becomes ~48px.

### Files to edit

- `src/components/instructor/SwipeableQuickAccess.tsx` — add `paddingBottom: 16` to the inline `style` on the grid container inside each page (line ~113), so spacing applies on every swipe page consistently.

### QA at 390px on `/instructor`

- Bottom row of tiles ("Pupils", "Track lesson") has clear breathing room below before the dots.
- No visible "gradient border" effect — the gap reads as intentional space, not a divider.
- Swiping between pages keeps the same spacing on every page.

