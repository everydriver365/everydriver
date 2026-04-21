

## Plan: Show all of today's lessons on the "Today's Schedule" tile

Currently the home tile uses `useTodayRemainingLessons`, which returns every non-cancelled lesson for today (already the whole day) — but the tile renders them through `TodayMiniTimeline`, and earlier lessons that are `completed` are dimmed/struck-through which is correct. The actual issue: the home view truncates the list (only the next few lessons render) so completed/earlier lessons aren't shown.

### Change

In `src/components/instructor/InstructorMobileHome.tsx`, where `<TodayMiniTimeline lessons={...} />` is rendered, pass the **full** `todayLessons` array instead of any sliced subset, and remove any "show next N" cap.

`TodayMiniTimeline` already:
- Sorts by `start_time` ascending.
- Marks completed lessons as `done` (dimmed + strikethrough + green tick).
- Marks the next upcoming as `next`.
- Marks past-but-not-completed as `overdue`.

So passing the full array gives a complete chronological view of the day with correct visual states.

### Files to edit

- `src/components/instructor/InstructorMobileHome.tsx` — remove the slice/cap on `todayLessons` before passing to `TodayMiniTimeline`; ensure the section header reads `Today's Schedule` (unchanged) and add a small count suffix `({n})` next to the header for clarity.

### QA at 390px on `/instructor`

- Day with 6 lessons, 2 completed, 1 in-progress overdue, 3 upcoming → all 6 render in order; completed ones dimmed with green tick; "Next" badge on the soonest upcoming; overdue ones show the amber "End lesson" nudge.
- Day with 0 lessons → tile hidden (existing behaviour from `TodayMiniTimeline` early-return).
- Realtime: completing a lesson updates its row state without a refresh (already wired via `useGlobalLessonSync`).

