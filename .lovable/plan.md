# Calendar sync: collapse to a header dot

Replace the always-on "Calendar sync" tile on the mobile home with a tiny status dot in the header. The full tile only appears when there's an actionable problem.

## Changes

**1. `src/components/instructor/CalendarSyncDot.tsx` (new)**
Small component that runs the same query as the current tile (connected? failed > 0? credential broken?) and renders a 8px dot:
- green — connected, no failed lessons
- red — failed > 0 or credential broken
- grey — not connected
- hidden while loading
Sits inline next to the instructor's first name in the top bar. No label, no tap behaviour (the tile below handles retry).

**2. `src/components/instructor/InstructorTopBar.tsx`**
Add optional `statusDot?: React.ReactNode` prop, rendered between the name and the chevron. Subpages don't pass it, so they're unchanged.

**3. `src/components/instructor/MobileHomeDSM2026.tsx`**
- Pass `<CalendarSyncDot instructorId={…} />` into `HeroHeader` → `InstructorTopBar`.
- Keep `<CalendarSyncStatusTile />` in the "At a glance" stack — it self-hides in the happy path now (see #4).

**4. `src/components/instructor/CalendarSyncStatusTile.tsx`**
Return `null` for the synced state and the pending-only state. Only render the tile when:
- not connected, OR
- failed > 0 (retry tile / credential-broken tile)

Pending lessons are transient and don't deserve a tile; they'll surface as red on the dot only if they fail.

No DB or sync-pipeline changes. Mobile-only update (desktop schedule tile, if any, isn't touched).
