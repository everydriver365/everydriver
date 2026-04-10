

# Fix: Remove all border radius rounding from instructor tiles

## Problem
The previous fix only changed the **outer container** of each tile to `rounded-none`, but all the **inner elements** (buttons, cards, icons, metric boxes, action bars, stat sections) still have `rounded-xl`, `rounded-2xl`, etc. These are what still look round.

## Scope
The following files need all non-circular `rounded-*` classes replaced with `rounded-none`:

**Note:** `rounded-full` on small circular elements like badges, dots, and status indicators will be **kept** — those are intentionally circular (e.g., notification count badges, dot indicators, avatar circles).

### Files to update

1. **`src/components/instructor/NextUpTile.tsx`** — ~30 instances of `rounded-xl` and `rounded-2xl` on inner sections (avatar, quick action buttons, stat cards, ETA section, weather section, vehicle health, action buttons, Start/End lesson buttons)

2. **`src/components/instructor/ActivityTilesGrid.tsx`** — `rounded-[10px]` on icon images (×4), `rounded-full` on the "all clear" banner

3. **`src/components/instructor/TelematicsTile.tsx`** — `rounded-xl` on fault codes section and MetricCard component

4. **`src/components/instructor/QuickActionTiles.tsx`** — `rounded-xl` on drag handles, icon containers, available tile list items, and tile containers in the rendered view

### Approach
- Global find-and-replace within each file: `rounded-2xl` → `rounded-none`, `rounded-xl` → `rounded-none`, `rounded-[10px]` → `rounded-none`
- Preserve `rounded-full` on truly circular elements (notification badges, dot indicators, status pips, avatar circles)
- Preserve `rounded-none` that already exists

