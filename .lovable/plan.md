# Plan: Surface clash warnings on the public booking flow

## 1. Friendly race-condition message in `LessonScheduler`
- Import `describeLessonClashError` from `@/lib/lessonClashCheck` in `src/components/booking/LessonScheduler.tsx`.
- Wrap the `scheduled_lessons` insert path: if the insert errors, run the error through `describeLessonClashError(err)`. When it returns a string, show that via `toast.error(...)` ("That slot is already booked. Please pick another time."), refresh the slot grid (re-trigger the slot/event fetch so the now-taken slot disappears), and clear the affected selection. Fall back to the existing generic error toast otherwise.
- Also add a final pre-insert `checkLessonClash({ instructorId, date, startTime, durationMinutes, bufferMinutes })` for each selected slot just before submit, so a stale tab catches conflicts before hitting the DB and shows the same friendly toast.

## 2. Widen all-day Google event blocking
- In `src/lib/lessonClashCheck.ts`, treat **all** all-day busy events (`is_busy = true`, duration ≥ 24h) as blocking, not just titles matching the holiday/leave regex. Keep the regex only as a label hint for the toast message ("Holiday", "Annual leave", etc.) — default label "Unavailable (all day)".
- Mirror the same change in `LessonScheduler.tsx`'s client-side `conflictsWithExternalEvents` filter so the date tile + slot list match the write-time check.

## 3. No other changes
- Buffer logic, Google refresh layer, DB trigger, and all instructor/admin/pupil flows already surface clash warnings — leave them untouched.
- No mobile layout changes.

## Technical notes
- Files touched: `src/components/booking/LessonScheduler.tsx`, `src/lib/lessonClashCheck.ts`.
- No schema changes, no edge function changes.
- Toast uses `sonner` (already imported in scheduler).
