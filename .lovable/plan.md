## Quick Access grid → 2 wide × 3 high (6 tiles per page)

Change the Quick Access section on the instructor home (`src/components/instructor/MobileHomeDSM2026.tsx`) so each swipeable page shows 6 tiles (2 columns × 3 rows) instead of the current 4 (2×2).

### Changes

1. **Page size** (line 2366): `const VISIBLE = 4;` → `const VISIBLE = 6;`
   - This is what controls how many tiles fit per swipeable page; the grid is already `repeat(2, 1fr)`, so 6 items naturally become 2×3.

2. **Default pins** (line 2305): trim `DEFAULT_PIN_LABELS` from 7 entries down to 6 so first-time users see one full page rather than a near-full page + a single orphan tile on page 2. Proposed order (keeps the most-used actions):
   - Schedule, Pupils, Test swap, Payments, Availability, Find slot
   - (Drops "Settings" from defaults — still reachable from the bottom nav / "All" view.)

### Out of scope

- No change to tile size, tile content, icons, or long-press pin behaviour.
- No change to the 8-pin upper cap, the Edit sheet, or `/instructor/quick-access` ("All") page (which already renders a single full grid, not paged).
- No change to desktop/other portals.