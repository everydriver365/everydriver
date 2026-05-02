## Goal

On the **instructor mobile Home page**, make the today/tomorrow lesson tile (`HomeTodaySchedule`) visually match the Calendar/Schedule rows we just unified — without losing any of its current Home-only behaviour (Live tint, Done strikethrough, EOL prompt, Conflict banner, status icons).

## What changes (visual only)

Wrap the list of lesson rows in the same flat white container used by the Calendar tab and the Schedule list:

- `background #FFFFFF`
- `borderRadius 12`
- `border 0.5px solid #E5E5EA`
- `padding 0 8px`
- `overflow hidden`

Hairline dividers between rows already exist (`0.5px #E5E5EA`); update their horizontal extent to `margin 0 -8px` (or leave full-bleed inside the new wrapper) so they match Calendar's indented-divider look — same hairline rule as Calendar.

## What stays exactly the same

- The whole rest of `HomeTodaySchedule` (header, segmented Today/Tomorrow tabs, stats strip, conflict banner, footer with "View full calendar" + "Add lesson", AddLessonSheet, EndLessonWizard).
- **Live row**: still uses the blue tinted block with the "In progress · X min remaining" line and the Live pill — this is a useful Home-only signal.
- **Completed row**: still uses strikethrough, opacity 0.55, "Done" pill, EOL prompt button, RowStatusIcons (✓ / £ / amber attention dot).
- **Default row**: already matches the Calendar row structure (50px right-aligned time column, 3px coloured accent bar, name + subtitle, RowStatusIcons + chevron) — only the surrounding container changes.
- All data hooks (`useTodayOverview`, `useDayLessons`, `useDayLessonHistory`), tap targets (`<Link to="/instructor/pupils/:id">`), conflict detection, and EOL wizard wiring are untouched.
- No props change; no other components touched.

## File to change

1. `src/components/instructor/HomeTodaySchedule.tsx` — only the wrapper `<div>` around the `lessons.map(...)` block (currently `<div style={{ display: "flex", flexDirection: "column" }}>` on line 697) becomes the new white rounded container. No other lines change.

## Out of scope

- The Live tinted block, the EOL prompt, the Done strikethrough, the conflict banner, the stats tiles, or any logic.
- Other tiles on the mobile home page.

## Acceptance

- The today/tomorrow lesson list on the mobile Home page now sits inside the same flat white rounded container as Calendar / Schedule.
- Live, Completed, and Upcoming rows still render with their existing visual cues and remain fully tappable.
- EOL prompt, Conflict banner, AddLesson and EndLesson flows continue to work.
