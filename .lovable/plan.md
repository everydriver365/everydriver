## Goal — Option A

Restore the rich functionality (Today/Week/Month switcher, real period stats, editable goals, tappable legend rows) that was lost when the strict-redesign cleanup removed `WeekAtAGlanceCard` from the home page, while keeping the merged "Today" card concept.

## Approach

Rebuild the merged Today card on `/instructor` so its top half is the full-featured `WeekAtAGlanceCard` (period switcher + editable goals + real stats from `useInstructorPeriodStats`) and its bottom half is the existing "Up Next / Done for today" zone.

Layout:

```text
┌─────────────────────────────────────────┐
│  TODAY · YOUR STATS         This week ▾ │
│  [ Today | Week | Month ]               │
│         ┌─────────┐                     │
│         │  rings  │   3 Lessons         │
│         └─────────┘                     │
│  ● Lessons      3 of 4         75%      │
│  ● Earned    £128 of £160      80%      │
│  ● Hours       4h of 6h        66%      │
│  Day resets at midnight    Set goals •  │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ [icon] UP NEXT · IN 25M             ›   │
│        Sarah Mitchell                   │
│        1h lesson · 14:30 at SO22        │
└─────────────────────────────────────────┘
```

Two stacked cards with a small 10px gap — visually paired but each a distinct tappable surface, which is necessary because `WeekAtAGlanceCard` already manages its own internal taps (segmented control, legend rows, "Set goals" button, expand/collapse).

## Implementation

Single file change: `src/components/instructor/CalmHomeHeader.tsx`.

1. Import `WeekAtAGlanceCard` from `@/components/instructor/WeekAtAGlanceCard`.
2. Remove the local `TodayCard` component and the now-unused `ConcentricRings`, `LegendRow`, and `ProgressRingsCompact`-style helpers that are no longer referenced anywhere.
3. In the `CalmHomeHeader` JSX, replace the current `<TodayCard …/>` with:
   - `<WeekAtAGlanceCard instructorId={instructorId} />` — restores period switcher, real stats, editable goals, tappable legend.
   - A spacer (`marginTop: 10`).
   - A standalone "Up Next / Done for today" tile (the bottom-zone code already in `TodayCard`, lifted out into its own small component or rendered inline) routing to `/instructor/diary`.
4. Drop unused imports/props: the rings no longer need `lessonsDone`, `lessonsTotal`, `earned`, `hoursTaught` props or the `useWeeklyGoals` / `useInstructorLiveStats` derivations (`WeekAtAGlanceCard` fetches its own data via `useInstructorPeriodStats`). Keep `useTodayRemainingLessons` / `useTodayOverview` only where they're still needed for the greeting status line.

## What this restores

- Today / Week / Month period switcher (segmented control + horizontal swipe)
- Editable goals via bottom sheet (tap "Set goals" / "Edit goals")
- Real lessons / £ earned / hours-taught data per period from `useInstructorPeriodStats` (no more derived `weeklyEarnings / 7` estimate)
- Tappable legend rows that deep-link: Lessons → schedule, Earned → pay, Hours → schedule
- Expand/collapse compact pill state on the rings card
- "Day resets at midnight" / "Week resets every Monday" / "Month resets on the 1st" footer copy

## Out of scope

- No changes to the 2×2 dashboard tile grid, weather banner, Tip of the Day, or any other home section.
- No changes to other portals or layouts.
- No data/query changes — `WeekAtAGlanceCard` already exists and works.