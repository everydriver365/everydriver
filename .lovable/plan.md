## Goal

On the instructor mobile home page (`/instructor` → `EveryInstructorHome`), the "Today's Schedule" rail currently treats every lesson identically. Once a lesson's scheduled end time has passed, the card should clearly show it as **Completed**, and indicate whether the **End-of-Lesson (EOL)** procedure has been done.

## Scope

Frontend only. One file: `src/pages/EveryInstructorHome.tsx`. No DB / backend / business-logic changes.

## Changes

### 1. Wire EOL-completed keys into the page
- Import `useDayLessonHistory` + `eolKey` from `@/hooks/useDayLessonHistory` (already used by `HomeTodaySchedule` / `TodayLessonsList`, so this is the established pattern).
- In `EveryInstructorHome`, call `useDayLessonHistory(instructor?.id, new Date())` to get the `Set<string>` of EOL-completed `pupilId|HH:MM:SS` keys.

### 2. Derive lesson completion state per card
For each lesson rendered in the "Today's Schedule" map:
- `isFinished` = `status === "completed"` OR `startTime + durationMinutes` is in the past (using `new Date()` compared to today's date + start_time).
- `eolDone` = `eolKeys.has(eolKey(pupilId, startTime))`.

Pass both to `LessonCard`.

### 3. Update `LessonCard` visuals
Extend props with `isFinished?: boolean` and `eolDone?: boolean`.

- **Not finished** (current behaviour): keep the blue→indigo gradient header.
- **Finished**: switch the header gradient to a muted slate (`linear-gradient(135deg, #64748B, #475569)`), reduce the card body opacity slightly (≈0.85), and render a small pill in the header row:
  - `eolDone === true` → green pill, check icon, label "EOL done" (bg `#10B981`).
  - `eolDone === false` → amber pill, alert icon, label "EOL pending" (bg `#F59E0B`).

Pill sits next to the time line (or under the name) — small, 10–11px, white text, `rounded-full px-2 py-0.5`. Uses existing lucide icons (`Check`, `AlertCircle`) already available in the project.

### 4. Keep ordering and existing behaviour
- Do **not** filter completed lessons out — they remain in the rail so the instructor can see what's done vs. upcoming at a glance.
- Tap behaviour unchanged (still navigates to the pupil).

## Out of scope
- No changes to `TodayLessonsList` / `HomeTodaySchedule` (those already display EOL state in other views).
- No changes to the underlying queries, RLS, or `lesson_history` writes.
- No layout/typography changes elsewhere on the page.
