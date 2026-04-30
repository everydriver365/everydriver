## Customize tile order & visibility

Add a small **Customize** button to the right of the search bar in the swipeable tile section. Tapping it opens a bottom sheet where the instructor can:

1. **Reorder** every tile (drag handle / up–down chevrons) — the order controls which 6 tiles land on page 1, page 2, etc.
2. **Hide** tiles they never use (× button). Hidden tiles disappear from pages and search.
3. **Restore** any hidden tile from a collapsed "Hidden tools" list at the bottom.
4. **Reset to default** link to fall back to alphabetical.

Order and hidden state persist per instructor in the existing `instructor_pinned_tiles` table — no new schema needed.

### What changes

```text
Search [33 tools]  [Customize]   ← new link, top-right
─────────────────────────────────
 Page 1 (6 tiles in user's order)
 ● ── ── ── ── ── ──             ← page dots
```

When a user hasn't customized anything, behaviour stays exactly as today: alphabetical 33 tiles across 6 pages.

### Files

**Reuse:**
- `useInstructorPinnedTiles` hook — already loads/saves the per-user array from `instructor_pinned_tiles`. We extend its meaning from "6 pinned" to "full ordered list of visible tile IDs".
- `instructor_pinned_tiles` table — same row, just stores up to 33 IDs instead of 6. No migration.

**Edit:**
- `QuickAccessSwipeablePaged.tsx` — read the saved order; when present, use it instead of alphabetical. Hide tiles missing from the saved list. Add **Customize** button.
- `CustomizeFrequentlyUsedSheet.tsx` → rename internally to `CustomizeTilesSheet.tsx`. Remove the 6-tile cap. Add a "Hidden tools" section with a + button to restore. Add "Reset to default" link.
- `useInstructorPinnedTiles.ts` — drop the `MAX_PINS = 6` enforcement; keep the same load/save shape.

**Untouched:**
- All 33 tile routes, plan-gating, live count badges, search, page-dot indicator
- Top of page (greeting, action card, rings, Up Next, etc.)

### Behavioural rules

- **Search** still searches all visible tiles (hidden ones excluded — they show only in the Customize sheet).
- **Default state:** when no saved order exists, render alphabetical. The Customize sheet pre-populates with that alphabetical order so the user can drag from a known starting point.
- **Reset:** clears the saved row → instantly returns to alphabetical 33-tile layout.
- **Page count adapts:** if the user hides 7 tiles, the section becomes 5 pages instead of 6. Page dots update.
- **Save:** "Done" button at the top of the sheet writes the new order; toast confirms; sheet closes.

### Out of scope

- No drag-and-drop on touch (uses up/down chevrons — same pattern as the existing sheet, works reliably on iOS).
- No per-page grouping UI (the page split is purely "every 6 in order").

After approval I'll wire it up — a single component edit, a sheet update, and a one-line change to the pinned-tiles hook.