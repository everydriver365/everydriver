## Goal

On the default instructor mobile home (`/instructor`), combine the two stacked tiles inside `CalmHomeHeader` into a single card:

- **Tile A** — "On track today" rings card (`ProgressRingsCompact`): concentric rings + Lessons / Earned / Taught legend.
- **Tile B** — "Up Next" / "Done for today" card (`UpNextTile`): green check + "No lessons coming up" when the day is finished, or the next pupil's name + time when there's a lesson coming.

These two cards currently sit one above the other and convey overlapping info ("done for today" / "X of Y lessons"). Merging them removes a tile, reclaims vertical space, and gives a single, calmer "Today" panel.

## Design

A single white rounded card with two zones, divided by a thin hairline:

```text
┌─────────────────────────────────────────────────┐
│  [rings 80px]   ON TRACK TODAY                  │
│      45%        ● 3 of 4   lessons              │
│                 ● £128     earned               │
│                 ● 4.5h     taught               │
│  ───────────────────────────────────────────    │
│  [icon]  UP NEXT · IN 25M             ›         │
│          Sarah Mitchell                         │
│          1h lesson · 14:30 at SO22              │
└─────────────────────────────────────────────────┘
```

End-of-day variant (no more lessons today):

```text
┌─────────────────────────────────────────────────┐
│  [rings 80px]   TODAY                           │
│     100%        ● 4 of 4   lessons              │
│                 ● £172     earned               │
│                 ● 6.0h     taught               │
│  ───────────────────────────────────────────    │
│  [✓]    DONE FOR TODAY                ›         │
│          No lessons coming up                   │
│          Tap to open your diary                 │
└─────────────────────────────────────────────────┘
```

Behaviour:
- Top zone (rings) tap → `/instructor/goals` (unchanged).
- Bottom zone (next/done) tap → `/instructor/diary` (unchanged).
- Both zones are independently tappable buttons inside one shared card shell.
- Eyebrow text on the rings becomes "On track today" while there are remaining lessons, and just "Today" once all lessons are done, to avoid duplicating the "Done for today" message immediately below.

## Implementation

Single file change: `src/components/instructor/CalmHomeHeader.tsx`.

1. Add a new component `TodayCard` that renders one rounded `#FFFFFF` shell (`borderRadius: 16, padding: 0, marginBottom: 16`) containing:
   - A top button reusing the existing rings + legend layout from `ProgressRingsCompact` (without its own outer card chrome — pull padding inward), routing to `/instructor/goals`.
   - A 0.5px `#E5E5EA` hairline divider with horizontal inset (`margin: 0 16px`).
   - A bottom button reusing the existing layout from `UpNextTile` (without its own outer card chrome), routing to `/instructor/diary`.
2. Swap dynamic eyebrow on the rings zone: `remainingToday > 0 ? "On track today" : "Today"`.
3. Replace the two separate `<ProgressRingsCompact />` and `<UpNextTile />` calls in the `CalmHomeHeader` JSX (lines ~292–306) with a single `<TodayCard … />` that receives the same props the two components already receive.
4. Keep `ProgressRingsCompact` and `UpNextTile` as internal helpers but no longer rendered standalone — or inline their internals into `TodayCard` and delete them. Prefer inlining to keep the file lean.
5. No changes to data hooks, props on `CalmHomeHeader`, or `InstructorMobileHome.tsx`.

## Out of scope

- No changes to the 2×2 dashboard tile grid, Tip of the Day, weather banner, or any other home section.
- No changes to mobile layout breakpoints or other portals.
- No data/query changes.