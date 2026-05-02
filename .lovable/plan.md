## Goal

On the instructor mobile **Schedule** tab (the "List" view at `MultiDayScheduleView`), make every entry **look identical** to the rows shown under the **Calendar** tab's selected-day panel (`MobileMonthCalendarView`), without changing any behaviour, data, or interactions.

## What "look the same" means (visual spec, taken directly from the Calendar view)

Each row becomes a flat, compact line — no elevated card, no large icon tile, no oversized time. Reference: lines 582–700 of `src/components/instructor/MobileMonthCalendarView.tsx`.

- Row layout: `time column · 3px coloured bar · title/subtitle · optional chevron`
- Time column: `min-width 50px`, right-aligned, `14px / 500` black time, `11px` grey duration underneath, tabular-nums
- Coloured bar: `width 3px`, `height 36px`, `borderRadius 2px`, colour = current `accentColor` per row (lesson blue `#2B7BC8`, driving test red `#C8434F`, external = Google colour, block = category colour)
- Title: `14px / 500` black, single line, ellipsis
- Subtitle: `12px` grey `#6E6E73`, single line, ellipsis
- Chevron: `12px`, grey `#6E6E73`, only when the row is tappable for details
- Row padding: `12px 8px`, `gap 12px`
- Day's rows wrapped in a single white container: `background #FFFFFF`, `borderRadius 12px`, `border 0.5px solid #E5E5EA`, `padding 0 8px`, hairline divider `0.5px #E5E5EA` (with `margin 0 8px`) **between** rows only
- Font stack: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif`

## Behaviour kept exactly as-is (do not touch)

- `MultiDayScheduleView` props, data fetching, the 365-day window, sticky day headers, day grouping, "today" highlight, scroll-to-today, sync, refresh key
- The `ExpandableLessonCard` wrapper for lessons (so all current actions — Navigate, Call, Text, On the way, Cancel, Reschedule, No-show, Delete, expand/collapse — keep working). We only swap **what is rendered inside `renderCustomCollapsed`**.
- All-day externals, timed externals, and manual blocks keep their current `onClick` toggling `expandedEventId`, the expanded `ExternalDetails` panel, and the block notes panel — only the collapsed row visual changes.
- The **Now** indicator, **Gap Filler** card (`GapFillCard`), **empty-day** placeholder, sticky day header, summary widget, FAB, sheets and dialogs are unchanged.
- All status / completion information keeps being shown, just rendered in the new compact form (see "Mapping" below).

## Mapping current row info → new compact row

The new row supports two slots beyond title/subtitle: a single trailing **micro-chip** (text/icon, ≤1 piece), and the chevron. Mapping:

- Pupil name → `title` (driving test keeps the `· driving test` suffix, same as today and same as Calendar view)
- Lesson type + location joined with ` · ` → `subtitle` (matches Calendar view at lines 545–548 of `MobileMonthCalendarView.tsx`)
- Duration → small line under time (already in spec)
- Trailing area, in priority order (only the highest-priority one shown to keep the row a single line, matching Calendar):
  1. `LIVE` pill (red) — when lesson is in progress
  2. `OVERDUE` pill (red) — when payment overdue
  3. `Needs attention` dot (`#FF9500`) — when past lesson missing EOL/payment
  4. `EOL` amber clock — past lesson, EOL pending
  5. `£` amber — past lesson, payment pending
  6. Tentative pill — when status is tentative
  7. Check-in badge — when set and lesson not past
  8. Quiet success ticks (`✓` green for EOL done, grey `£` for paid, grey notes icon) — collapsed into one trailing icon row, **only if no higher-priority item present**
- Chevron: shown for lesson, block; hidden for all-day and timed externals (matches Calendar view rules)

This preserves every signal currently surfaced; it just compresses badges into a single trailing slot so the row stays a single tight line like the Calendar view.

## Files to change

1. **`src/components/instructor/MultiDayScheduleView.tsx`**
   - Replace the `ScheduleListRow` component body with the compact row markup from `MobileMonthCalendarView.tsx` (lines 592–700), parameterised so it still accepts every existing prop (`timeText`, `durationText`, `accentColor`, `title`, `subtitle`, `metaLine`, `statusPill`, `showChevron`, `kind`, `isOverdue`, `completion`, `needsAttention`, `checkInStatus`, `onClick`).
   - Drop the per-row elevated white card / shadow / 36×36 icon tile / 22px radius / 100px min-height. The day's rows are wrapped together in a single bordered container instead.
   - Remove `RowDivider`'s no-op usage at the call sites and instead render the inline `0.5px #E5E5EA` hairline between rows (same as Calendar) inside a new per-day wrapper.
   - Wrap each day's rendered rows (all-day, timeline lessons/externals/blocks, gap fillers, now indicator, empty placeholder) in the new white rounded container. Gap fillers and the Now indicator render as their own rows inside the container with the same hairline rules as Calendar.
   - Keep `ExpandableLessonCard` wrapping lesson rows; only its `renderCustomCollapsed` now returns the new compact `ScheduleListRow`. All expand/action behaviour is unchanged.

2. No changes to `MobileMonthCalendarView.tsx`, `scheduleGoogleStyle.ts`, `ExpandableLessonCard`, `GapFillCard`, hooks, queries, data shapes, or routes.

## Out of scope

- Desktop Calendar / Schedule views (`InstructorCalendar`, `GoogleStyleScheduleView`)
- Month grid itself
- Any logic, query, RLS, or data change

## Acceptance

- Open Schedule → List on mobile: every lesson, external event, block, all-day item, gap filler, and Now indicator renders in the same flat compact style as the Calendar tab's day panel.
- Tapping a lesson row still opens the existing `ExpandableLessonCard` actions; tapping an external/block still expands details; gap filler still offers the slot; sync, FAB, sheets, completion indicators, and check-in badges still appear (now in the trailing slot).
- Sticky day headers, "today" colour, and scroll-to-today still work.
