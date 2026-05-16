## What's wrong

The course booking page (`/book/:instructorId`) renders `LessonScheduler`, which still fetches `get_public_scheduled_lesson_blocks` and merges every CRM lesson into the conflict list. For Ken on Tue 2 Jun those CRM rows are 10:30/120, 10:30/180, 11:00/120 (×several) — so the engine treats 10:30–13:30/14:00 as "busy", leaving only **14:00–16:00**.

This violates the core rule:
> Google Calendar (`instructor_calendar_events`) + `instructor_manual_blocks` are the ONLY sources of "instructor is busy". `scheduled_lessons` is CRM data, never consulted for availability.

The previous "live data" refactor cleaned up `courseAvailability.ts` / `availabilityEngine.ts` but missed two callers.

## Files to change

### 1. `src/components/booking/LessonScheduler.tsx`
- Remove the `supabase.rpc("get_public_scheduled_lesson_blocks", …)` call from the `Promise.all` (lines 287–319).
- Remove `lessonsRes` destructuring and the `existingLessons` / `lessonEvents` mapping block (lines 348–355).
- In `setExternalEvents([...])` (line 375+), drop the `...lessonEvents` spread — keep only timed calendar events + manual block events.
- Remove any now-unused imports/types tied to scheduled lessons.

### 2. `src/utils/autoScheduler.ts`
- Remove the `get_public_scheduled_lesson_blocks` RPC from the `Promise.all` (lines 120–137).
- Remove `lessonsRes` / `lessons` and the block that pushes them into `blockedSlots` (lines 177–182).
- Replace with calls to `get_public_instructor_calendar_blocks` + `get_public_instructor_manual_blocks` so busyness uses the correct sources (matches what `LessonScheduler` will now use). Apply `isAllDayLikeEvent` filter to calendar events, same rule as the engine.
- Remove the `ScheduledLesson` type usage in this file.

### 3. No DB changes
The RPC `get_public_scheduled_lesson_blocks` remains in the DB (it's still legitimately used elsewhere like reports), we just stop calling it from availability paths.

## Verification

After the change, reload `/book/c9843b58-…/?hours=10&date=2026-06-19` and pick **Tue 2 Jun**:
- Expected slots (2h, 30-min increments, working hours 10:30–16:00, no real GCal/manual conflicts in that window): **10:30, 11:00, 11:30, 12:00, 12:30, 13:00, 13:30, 14:00**.
- Morning GCal events for Ken are 07:00–10:00 BST (before window) and 17:00–20:00 BST (after window) — neither should clip the bookable range.

## Out of scope
Admin tools (`AdminBookingsManager`, `PupilRecordsManager`, etc.) that read `scheduled_lessons` for CRM/reporting reasons stay untouched — they are not on the availability path.