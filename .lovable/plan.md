## Goal

Make the existing instructor mobile tiles **stand out** more from the page background — same layout, same icons, same content, same components. Just lift the surface so the tiles read as raised cards (like the screenshot) instead of barely-there outlined boxes.

## What changes

A single-file edit to `src/components/instructor/InstructorTile.tsx`:

- **Add a soft drop shadow** to the tile container so it lifts off the cool-grey backdrop  
  `boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04), 0 4px 12px rgba(16, 24, 40, 0.06)"`
- **Soften the hairline border** from `0.5px solid #E5E5EA` to `0.5px solid rgba(0,0,0,0.04)` so the lift comes from shadow, not a hard line (matches the screenshot)
- **Bump the corner radius** from 12 → 14 to match the screenshot's slightly softer corners
- **Add a subtle press-shadow reduction** on `:active` (already scales 0.97 — just compress the shadow at the same time) for the premium tap feedback

## What does NOT change

- No new components, no new files
- No layout, spacing, padding, icon sizes, typography, palette, or grid changes
- No behaviour, routes, data, or props change
- `WarmTile`, `BestMateTile`, `StatCard`, the side menu drawer, the bottom nav — all untouched
- Dark mode tiles untouched (shadow tokens are subtle enough to work on both, but I'll keep the existing dark treatment via the `.dsm-dark` scope if any consumer overrides it)

## Files

- **Edit**: `src/components/instructor/InstructorTile.tsx` (container style + active state only)

That's it — one small visual change, applied everywhere the unified tile is used.