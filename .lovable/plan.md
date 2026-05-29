# Add "See all" link to Quick access section

Add a **See all** text link immediately to the left of the existing **Edit pins** link in the Quick access section of the instructor mobile home (`MobileHomeDSM2026.tsx`). Tapping it navigates to a new full-page screen listing every quick action tile in one scrollable view.

## Changes

### 1. `src/components/instructor/MobileHomeDSM2026.tsx` (line ~2346)
Replace the single `Edit pins` button with a small row containing two text links: `See all` (navigates to `/instructor/quick-access/all`) and `Edit pins` (existing behavior). Same typography (13px, semibold, `ACTION_BLUE`), separated by a subtle dot or 12px gap. Trigger `haptics.selection()` on tap and use `useNavigate()` from `react-router-dom` (already imported in this file).

### 2. New page `src/pages/InstructorQuickAccessAll.tsx`
A mobile page rendered inside the existing instructor mobile shell (matches sibling pages like `InstructorMenu`). Contents:
- Header: back chevron + title "Quick access"
- Body: every tile from `QUICK_ACCESS_TILES` (`src/components/instructor/quickAccess/tileRegistry.ts`) rendered using the same tile visual as the home grid (reuse the existing tile component used inside `QuickAccessTiles.tsx` so spacing, icons, tones, and unread badges match exactly).
- Grouped by the `category` field already available via `QUICK_ACTIONS_CATALOG` (`src/lib/quickActionsCatalog.ts`) — sections in this order: Lessons, Pupils, Money, Vehicle, Network, Admin, More. Each section gets a small uppercase muted label (same style as the "Quick access" label on home, 10px / 700 / letter-spacing 1.2).
- Respects feature gating: hide tiles whose `requiredFeature` is not enabled (use the same gating hook the home grid uses — `useInstructorFeatureToggles` / `useMenuFeatureGates`, whichever `QuickAccessTiles.tsx` already uses).
- Tapping a tile navigates to its `route` (same as home tiles).

### 3. Route registration
Add the route in **both** places that route to instructor mobile pages so the screen works in both shells:
- `src/routes/instructorAppRoutes.tsx` — `/instructor/quick-access/all` → `InstructorQuickAccessAll`
- `src/routes/everyInstructorRoutes.tsx` — `/every-instructor/quick-access/all` → same component

The Quick access header's `See all` link routes to the variant matching the current portal (detect via current pathname prefix, mirroring how `MobileHomeDSM2026` already handles `/every-instructor` vs `/instructor` navigation elsewhere in the file).

## Out of scope
- No changes to tile data, ordering logic, or the Edit pins sheet.
- No desktop/portal changes.
- No backend or schema changes.
