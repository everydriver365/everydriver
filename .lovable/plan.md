## Goal

Now that the time-drift and destructive-reconcile bugs are fixed in code, repair the live data for instructor Ken D so Home, Schedule, and pupil records all agree.

## Steps

1. **Stop the runaway queue**
   - Clear the 1,280 pending `syncLesson` queue entries for this instructor so old (pre-fix) jobs don't re-shift times.
   - Keep the queue table itself; only delete pending rows for this instructor.

2. **Fix already-drifted DSM lesson times**
   - For each active `scheduled_lessons` row linked to a Google event, compare DSM `start_time` against the Google event's London wall-clock time.
   - Where DSM has drifted (e.g. Soraya/Joseph showing 11:30 or later when Google shows 10:30), reset DSM `start_time` to match the Google wall-clock.
   - Re-run a single clean sync per lesson using the fixed code path so both sides agree.

3. **Restore the wrongly-cancelled 19 May lessons (only if Ken approves each one)**
   - List the 10 lessons cancelled on 19 May 2026 (6 on 9 Jun, 2 on 10 Jun, 2 on 12 Jun) with pupil + time.
   - For each one Ken confirms was a real booking, clear `deleted_at` / `cancelled_at` and set status back to `scheduled`.
   - Leave the rest cancelled.

4. **Resolve the 3 Google-only "Lesson : ..." events**
   - Mon 8 Jun 10:30 "Lesson : Soriya"
   - Tue 9 Jun 10:30 "Lesson : Joseph"
   - Fri 12 Jun 10:30 "Lesson : Joseph"
   - For each, either (a) create a DSM `scheduled_lessons` row linked to the existing Google event, or (b) dismiss as not-a-lesson. Ken decides per row; no auto-create.

5. **Verify**
   - Re-query the week. Confirm Home next-lesson tile, Schedule, and each pupil's record show the same lessons at the same times.
   - Confirm sync queue stays small (single-digit) over the next cycle.

## What I will NOT do

- No bulk lesson creation from Google events.
- No edits to pupil balances, payments, or lesson history.
- No restoring cancellations without Ken's explicit per-lesson approval.

## Technical notes

- Queue purge: `DELETE FROM calendar_sync_queue WHERE instructor_id = '<ken>' AND status = 'pending'`.
- Drift repair: read `instructor_calendar_events.start_time`, convert to Europe/London wall-clock via `toLondonParts`, write back to `scheduled_lessons.start_time` / `lesson_date` where they differ, then call `sync-lesson-now` once per lesson.
- Restorations: `UPDATE scheduled_lessons SET status='scheduled', cancelled_at=NULL, cancelled_by=NULL, cancellation_reason=NULL, deleted_at=NULL WHERE id = ANY($1)`.
- Google-only → DSM: insert `scheduled_lessons` with `google_event_id` set to the existing event id so no new Google event is created.

## What I need from you

Just reply "go" and I'll start with steps 1 and 2 (safe — purge queue and align DSM times to Google). Then I'll come back with the exact lists for steps 3 and 4 for you to tick.
