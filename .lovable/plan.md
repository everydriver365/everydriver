## Goal

Wire the new "Complete EOL" prompt on the Today's schedule card into the **existing** `EndLessonWizard` flow, and source EOL-completeness from the canonical `lesson_history` table (not from `scheduled_lessons.notes`).

## Why

`EndLessonWizard` already runs the full end-of-lesson procedure (mark complete → upload voice note → insert `lesson_history` → request feedback → award points → deduct balance → check course completion → trigger automations). Today the new prompt:
- Routes to the pupil page instead of opening this wizard.
- Derives "EOL done" from `scheduled_lessons.notes`, which the wizard doesn't write to (it writes `lesson_history.notes`).

So the badge currently mis-fires and the tap goes to the wrong place.

## Changes

### 1. New hook: `src/hooks/useDayLessonHistory.ts`

Query `lesson_history` for the instructor on the given date, returns a `Set<string>` of `"{pupil_id}|{HH:MM:SS}"` keys (matches `scheduled_lessons.pupil_id` + `start_time`). Exports `eolKey(pupilId, startTime)` helper. `staleTime: 30s`, refetch on window focus, `enabled` guarded by `instructorId`.

### 2. Realtime invalidation: `src/hooks/useGlobalLessonSync.ts`

Add `"day-lesson-history"` to `LESSON_QUERY_KEYS` and add a new `useRealtimeSubscription("lesson_history", "*", invalidate, …)` so EOL completions propagate live.

### 3. `src/components/instructor/HomeTodaySchedule.tsx`

- Import `useDayLessonHistory`, `eolKey`, and `EndLessonWizard`.
- Call `useDayLessonHistory(instructorId, targetDate)` alongside `useDayLessons`.
- Replace the local `isEOLComplete(lesson)` (which checked `notes`) with: `eolDoneKeys.has(eolKey(pupil_id, start_time))`. Treat "still loading" as "complete" so the prompt never flickers in.
- Add wizard state: `wizardLesson: TodayLesson | null` and `wizardBalance: number` (default 0).
- New handler `openEOLWizard(lesson)`:
  1. Fetch `pupils.account_balance` for `lesson.pupilId` (one-shot; tolerate missing as 0).
  2. `setWizardLesson(lesson)` and open the sheet.
- The amber `EOLPrompt` now calls `openEOLWizard(lesson)` instead of navigating.
- Render `<EndLessonWizard … />` next to `<AddLessonSheet />` with these props pulled from `wizardLesson`: `lessonId`, `pupilId`, `pupilName`, `instructorId`, `durationMinutes`, `lessonDate` (today's `yyyy-MM-dd` for the active tab), `startTime`, `currentBalance: wizardBalance`, `onCompleted`: invalidate `["day-lessons"]`, `["day-lesson-history"]`, `["today-overview"]`, `["today-remaining-lessons"]`, then close.

No other behaviour changes — Today/Tomorrow toggle, lesson tap-through, Add lesson, View full calendar, conflict banner, stat tiles, and all existing `EndLessonWizard` usages elsewhere (`NextUpTile`, `TodayScheduleView`, `InstructorPortalLayout`) are untouched.

### 4. Revert the `notes` plumbing added in the previous step

`useDayLessons.ts` and `useTodayRemainingLessons.ts`: drop `notes` from the SELECT and the mapped object — it's no longer used and keeps payloads slim. (`TodayLesson.notes` field removed.)

## Out of scope

- Any change to `EndLessonWizard` itself or any other surface that opens it.
- Backfilling missing `lesson_history` rows for already-completed lessons (those will continue to show "Complete EOL" until the wizard is run, which is the correct behaviour).
- Mobile layout changes elsewhere on the home screen.

## Verification

- Completed lesson with no `lesson_history` row → amber "Complete EOL" pill visible. Tap opens `EndLessonWizard`. Finishing it inserts `lesson_history`, the realtime subscription fires, the pill disappears, the row stays struck-through.
- Completed lesson with an existing `lesson_history` row → no pill. Row tap still goes to the pupil page.
- Live and upcoming rows → no pill regardless of history state.
- Tomorrow tab → all rows render as upcoming (pill never shows).
