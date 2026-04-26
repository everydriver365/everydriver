## Goal

On the instructor mobile homepage, visually strike through and dim any lesson tile in the "Today's Lessons" list once that lesson has been conducted (i.e. its status is `completed`), so the instructor can see at a glance what's already done.

## Where

`src/components/instructor/TodayLessonsList.tsx` — the timeline-style list that renders today's lesson cards on the mobile home (`InstructorMobileHome.tsx`).

The data hook (`useTodayRemainingLessons`) already returns lessons with their `status`, including `completed`, so no data changes are needed.

## Visual treatment for completed lessons

- Pupil name, time range, and time label rendered with `line-through`.
- Whole tile faded to ~55% opacity (matches the existing cancelled-lesson treatment).
- Timeline dot switched from primary to muted grey so the timeline reflects which stops are done.
- Lesson-type badge replaced with a subtle "Done" badge, since the existing payment "Done/Unpaid" badge stays as-is on the right.

The `HomeTodaySchedule` component already has line-through for completed lessons, so this brings `TodayLessonsList` in line with it.

## Out of scope

- No change to how a lesson becomes `completed` (that still flows from the existing lesson-completion / GPS-end logic).
- No change to data fetching, ordering, or the cancelled-lesson behaviour.
- No change to `HomeTodaySchedule` — it already handles this.
