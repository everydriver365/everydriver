## Goal

Turn the 2x2 instructor activity grid (Job offers, Messages, Tests, Fill gaps) into a more pronounced, soft-neumorphic "Overview" dashboard block. Larger tiles, deeper but still subtle dual shadow, more breathing room, and a clear section header.

## What changes

Visible result on the instructor mobile home:

```text
OVERVIEW
Your activity at a glance

┌──────────────┐  ┌──────────────┐
│ [icon]    ●1 │  │ [icon]   ●87 │
│              │  │              │
│ Job offers   │  │ Messages     │
│ 1 pending    │  │ 87 unread    │
└──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐
│ [icon]    ●6 │  │ [icon]       │
│              │  │              │
│ Tests        │  │ Fill gaps    │
│ 6 swap reqs  │  │ No open slots│
└──────────────┘  └──────────────┘
```

## Files to change

1. **`src/components/instructor/ActivityTilesGrid.tsx`** — add the "Overview / Your activity at a glance" header above the grid; keep the "All clear" empty state but place it under the same header.
2. **`src/components/instructor/InstructorTile.tsx`** — bump radius/padding/shadows/icon size to the new soft-UI spec. This automatically also updates the Insight grid and any other consumers, which is the desired consistency.

No route, data, navigation, or count logic changes. Mobile home composition (`InstructorMobileHome.tsx`) is untouched — the new header lives inside `ActivityTilesGrid`.

## Visual spec (delta from current)

**Section header** (new, inside `ActivityTilesGrid`, above the grid)
- Padding: `0 16px`, `margin-bottom: 12px`
- Eyebrow `OVERVIEW`: 11px / 600 / `#6B7280` / uppercase / letter-spacing 0.4px
- Subtitle `Your activity at a glance`: 13px / 400 / `#6B7280` / margin-top 2px

**Tile container** (`InstructorTile`)
- Background: `#F8FAFC` (unchanged)
- Border-radius: `18px → 20px`
- Padding: `20px → 24px`
- Min-height: `110 → 124`
- No border (unchanged)
- Dual shadow (deeper but still soft):
  - Outer: `8px 8px 16px rgba(0,0,0,0.06)`
  - Highlight: `-8px -8px 16px rgba(255,255,255,0.9)`
- Hover (pointer devices): `translateY(-3px)` + `10px 10px 20px rgba(0,0,0,0.08)` / `-10px -10px 20px rgba(255,255,255,1)`
- Active: `scale(0.98)` (unchanged)
- Reduced-motion: no transform/transition (unchanged)

**Icon container** (inside tile)
- Size: `40 → 52` square, radius `12 → 14`
- Background: per-category soft tint at **0.18** opacity (up from 0.15) — palette already maps cleanly:
  - money/jobs `rgba(245,158,11,0.18)` → icon `#D97706`
  - people/messages `rgba(34,197,94,0.18)` → icon `#16A34A`
  - education/tests `rgba(139,92,246,0.18)` → icon `#7C3AED`
  - schedule/gaps `rgba(59,130,246,0.18)` → icon `#2563EB`
  - location/vehicle `rgba(239,68,68,0.18)` → icon `#DC2626`
  - insights `rgba(139,92,246,0.18)` → icon `#7C3AED`
  - settings `rgba(107,114,128,0.18)` → icon `#4B5563`
- Icon: 24px, stroke 2 (was 22px)
- Soft outer + inset highlight on the icon chip:
  - `box-shadow: 2px 2px 5px rgba(0,0,0,0.05), inset 1px 1px 2px rgba(255,255,255,0.6)`

**Text**
- Gap between icon and text: `12 → 16`
- Title: 15px / 600 / `#111827` (weight 500 → 600)
- Subtitle: 12px / 400 / `#6B7280`, margin-top 4px

**Count badge** (top-right of icon chip)
- Solid category accent, white text (unchanged)
- Min-width 22, height 22, radius 11
- New shadow: `0 4px 10px rgba(0,0,0,0.15)` (replaces `0 2px 6px`)
- Position: top: -6, right: -6 (unchanged)

**Grid**
- Gap: `16 → 24`
- Section padding: `16px 16px 20px` (unchanged)

## Out of scope / preserved

- Empty state ("All clear — no actions needed") still renders under the new Overview header.
- `AppStyleHomeView` wallpaper-grid layout (4-column app-icon grid at `/instructor-app/...`) is untouched. This redesign targets the dashboard activity grid only.
- DSM dark theme tokens unchanged — light surface only.
- No hooks, no routing, no data fetching changes.
- Mobile-update memory rule respected: this is the explicit instruction to refine the mobile home dashboard tiles.
