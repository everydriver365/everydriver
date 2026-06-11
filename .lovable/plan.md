## What I found

The login itself is now succeeding: the backend auth log shows Kenneth’s email/password login returned 200.

The screenshot is the instructor mobile dashboard after login. The two spinners below “Needs attention” are coming from:

- `PendingBookingsCard`
- `RescheduleRequestsCard`

Both cards start with `loading = true`, then run database reads. If those reads fail, hang, or run before a valid instructor id is ready, they sit as standalone spinners and make the dashboard look broken.

I also found repeated backend errors: `scheduled_lessons.end_time does not exist`. The live `scheduled_lessons` table has `lesson_date`, `start_time`, and `duration_minutes`, but no `end_time`. Some deployed backend code still asks for `end_time`, so that needs correcting separately where it is still referenced.

## Plan

1. Harden `PendingBookingsCard`
   - If no `instructorId` is present, stop loading immediately and render nothing.
   - Wrap fetches in `try/catch/finally` so the spinner always clears.
   - On read errors, log the error and render nothing rather than spinning forever.
   - Only fetch pupil names when pending rows exist.

2. Harden `RescheduleRequestsCard`
   - Same no-id guard.
   - Same `try/catch/finally` protection.
   - Ensure pupil/lesson hydration failures cannot leave the card loading forever.

3. Fix the missing `scheduled_lessons.end_time` backend reference
   - Update `supabase/functions/whatsapp-webhook/index.ts` to select `duration_minutes` instead of `end_time` from `scheduled_lessons`.
   - Compute the lesson end time from `lesson_date + start_time + duration_minutes` where needed.
   - This avoids the repeated backend errors without adding a redundant database column.

4. Validate
   - Check for remaining frontend references to `scheduled_lessons.end_time`.
   - Re-check backend logs/network signal after the change.
   - If edge function code changed, deploy the affected function so published users get the fix.

## Expected result

The dashboard should no longer sit with permanent spinning loaders. If there are no booking/reschedule requests, those sections will simply disappear, and the lower dashboard content should load normally.