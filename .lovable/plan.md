I found why the app still looks inconsistent:

- The main mobile instructor app uses several different tile systems, not one. Some use `InstructorTile`, some use `Tile`, some use raw `div/button` cards, and many use inline styles.
- The Quick Actions carousel uses `src/components/instructor/Tile.tsx`, and its refined tile variant explicitly sets `boxShadow: "none"`, so the global lift rules cannot affect it.
- Several logged-in instructor pages are wrapped by `InstructorPortalLayout`, while the marketing `/instructor-app/...` pages use `InstructorSaaSLayout`; the previous work mainly improved scoped shadow utilities, but many tile surfaces do not use any shadow class at all.
- Some cards already have a lift, but with different strengths (`0 1px`, `0 2px`, `shadow-lg`, raw inline shadows), which is why the UI feels disjointed.
- The CSS currently tries to catch shadow classes globally, but that misses plain `bg-white/bg-card rounded` tiles and inline `boxShadow: none` surfaces.

Plan:

1. Create one shared instructor tile elevation style
   - Add a reusable CSS class for the instructor app tile lift, e.g. `.instructor-tile-lift`.
   - Use the same visible 3-layer shadow everywhere.
   - Include active/pressed state so tappable tiles feel consistent.
   - Keep radius, colour, typography and layout unchanged unless a tile needs the class added.

2. Fix the actual tile primitives
   - Update `InstructorTile` so all tiles using that primitive have the shared lift.
   - Update `Tile.tsx` so Quick Actions and other refined/default tile grids no longer use `boxShadow: "none"` and instead use the shared lift.
   - Update `StatCard` to use the same lift rather than a separate shadow string.
   - This will automatically fix Activity tiles, Insights, Quick Actions search results, and any grids built from those primitives.

3. Fix the mobile home page’s standalone cards
   - Apply the same lift to:
     - the top three `WarmHomeTiles` cards
     - `HomeTodaySchedule`
     - `NextUpTile`
     - `TelematicsTile`
     - `VehicleHealthCard`
     - `IdleTimeCostCard`
     - empty/all-clear cards that are visually tiles
   - Remove or replace older inline shadows so they do not conflict.

4. Fix page-level tile rows that bypass primitives
   - Update obvious raw instructor tile/card patterns such as settings/menu tiles and dashboard stat buttons where they are plain `bg-white/bg-card rounded` surfaces with no shadow class.
   - Add the shared lift class instead of relying on hover-only shadows.

5. Tighten the global safety net
   - Keep a scoped global rule inside `.instructor-portal` / `.dsm-instructor`, but make it a fallback only.
   - Add selectors for common tile surfaces that currently have no shadow utility, while excluding headers, nav, maps, sheets/dialogs, menus, toasts, search overlays, and tiny icon badges.
   - Avoid broad `section`/container lifting so page backgrounds are not accidentally elevated.

6. Verify coverage with a focused search
   - Search instructor files for `boxShadow: "none"`, weak `0 1px` shadows, `shadow-none`, and `bg-white/bg-card rounded` tile surfaces.
   - Confirm the key requested areas are covered: Quick Actions, Telematics, and the top three instructor mobile home tiles.

Technical notes:

- The core issue is not data or routing; it is multiple visual primitives plus inline styles overriding the intended elevation.
- The fix should be explicit at the tile component level, not only global CSS, because inline `boxShadow` values can bypass class-based styling.
- No backend/database changes are needed.