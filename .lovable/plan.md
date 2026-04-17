
Goal: Add a "Start Tracker" action to every Next Lesson / schedule tile that jumps to the tracking page with the pupil pre-selected, removing the manual reselect step.

## Investigation needed
- `NextUpTile.tsx` — already has a Tracker pill (≤30 min). Need to extend to all upcoming lessons and pass `pupilId`.
- `ExpandableLessonCard` (used in `MultiDayScheduleView`) — schedule tiles where the button must also live.
- `/instructor/tracking` page — how it reads URL params today and selects a pupil.

## Plan

**1. Tracking page — accept `?pupilId=` param**
- Read `pupilId` from `useSearchParams` on mount
- If present and pupil exists in instructor's list → auto-select that pupil and (optionally) auto-start the tracker view
- Falls back to current manual selection if param missing/invalid

**2. Next Lesson tile (`NextUpTile.tsx`)**
- Show the "Tracker" pill on EVERY upcoming lesson (drop the ≤30 min gate, or relax to "today + tomorrow")
- Link target becomes `/instructor/tracking?pupilId={pupilId}&lessonId={lessonId}`
- Keep dismiss (X) optional — or remove since it's now a useful primary action, not a reminder
- Decision needed: keep dismiss or not (see question)

**3. Schedule tiles (`ExpandableLessonCard`)**
- Add a small "Start Tracker" button/icon in the card actions row
- Same link: `/instructor/tracking?pupilId={pupilId}&lessonId={lessonId}`
- Only render when the lesson has a `pupilId` (skip blocks/external events)

**4. Files to edit**
- `src/pages/InstructorTracking.tsx` (or equivalent) — read & apply `pupilId` param
- `src/components/instructor/NextUpTile.tsx` — always show pill, pass pupilId
- `src/components/instructor/ExpandableLessonCard.tsx` — add tracker button

## Open question
Auto-start behaviour on the tracking page when `pupilId` is provided — just preselect, or also auto-begin live view?
