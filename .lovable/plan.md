## Goal

Restyle the instructor mobile home page tiles (Job offers, Messages, Tests, Fill gaps, Vehicle health, Smart nudges, Re-engage, etc.) using a soft, modern neumorphic look — gently raised, tactile, premium iOS/SaaS feel.

## Files to change

1. **`src/components/instructor/InstructorTile.tsx`** — core tile component used by every grid (Activity, Insight, WarmTile shim).
2. **`src/components/instructor/AppStyleHomeView.tsx`** — page background.
3. **`src/components/layout/InstructorPortalLayout.tsx`** — outer layout background, so tiles sit on the matching neutral.

The change to `InstructorTile.tsx` automatically updates `ActivityTilesGrid`, `InsightTilesGrid` and `WarmTile` (compat shim) — no per-tile edits needed.

## Visual spec

**Page background**
- `#F3F5F9` (very light cool neutral, no gradient)

**Tile container**
- Background: `#F8FAFC` (slightly lighter than page → catches highlight)
- Border radius: `18px`
- Padding: `20px` (keeps min-height ~110)
- Remove the `0.5px solid #EEF0F4` hairline border completely
- Dual neumorphic shadow:
  - Outer (bottom-right): `6px 6px 12px rgba(0,0,0,0.06)`
  - Highlight (top-left): `-6px -6px 12px rgba(255,255,255,0.9)`
- Hover (pointer devices only):
  - `transform: translateY(-2px)`
  - Outer: `8px 8px 16px rgba(0,0,0,0.08)`
  - Highlight: `-8px -8px 16px rgba(255,255,255,1)`
- Active: `scale(0.98)` (replaces current 0.97 tap)
- Reduced-motion: no transform/transition

**Icon container** (inside tile, top-left)
- Size: 40×40, radius `12px`, padding `10px`, line icon 22px / stroke 2
- Per-category tint backgrounds (override current pale tints with the requested rgba palette):

  | Category (current key)   | Tint                          | Icon stroke   |
  |--------------------------|-------------------------------|---------------|
  | money (jobs)             | `rgba(245,158,11,0.15)`       | `#D97706`     |
  | people (messages)        | `rgba(34,197,94,0.15)`        | `#16A34A`     |
  | education (tests)        | `rgba(139,92,246,0.15)`       | `#7C3AED`     |
  | schedule (calendar/gaps) | `rgba(59,130,246,0.15)`       | `#2563EB`     |
  | location (vehicle)       | `rgba(239,68,68,0.15)`        | `#DC2626`     |
  | insights                 | `rgba(139,92,246,0.15)`       | `#7C3AED`     |
  | settings                 | `rgba(107,114,128,0.15)`     | `#4B5563`     |

  These map cleanly onto the existing `TILE_CATEGORY_COLORS` so all consumers (Activity grid, Insight grid, WarmTile) get the new look automatically.

**Typography**
- Title: `15px / 500 / #111827`, letter-spacing `-0.2px`
- Subtitle: `12px / 400 / #6B7280`
- Spacing between icon block and text: `12px` (unchanged)

**Counter badges** (e.g. "87", "6")
- Solid accent colour background (per category), white text
- Circular, min-width 20, height 20
- `box-shadow: 0 2px 6px rgba(0,0,0,0.15)` (replaces current white ring)
- Position unchanged (top-right of icon block)

**Grid spacing**
- Gap between tiles: `16px` (up from 12)
- Section padding: `16px 16px 20px` (unchanged horizontally)

## Non-goals / preserved behaviour

- No changes to tile data, routes, click handlers, count logic, demo mode, or Activity/Insight grid component APIs.
- No mobile-only conditional changes — this matches the memory rule because the home page is already a mobile-first surface and the redesign is the explicit instruction.
- No layout/tile content reorder. Hero, BestMate pair, QuickStatsChips, BottomPromoGroup untouched.
- Light theme only. The DSM dark theme (scoped to `.instructor-portal`) keeps its existing tokens; we only adjust the light surface.

## Result

Soft, gently raised tiles on a cool light background, with tinted icon chips, solid coloured count badges, and a subtle hover lift — clean iOS/SaaS aesthetic, no harsh borders or gradients.