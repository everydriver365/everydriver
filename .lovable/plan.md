## Why Add Lesson is failing

The Confirm Booking dialog returns *"Could not add to Google Calendar — slot released, no booking made"* whenever the synchronous Google push throws (timeout, token race, transient 5xx). The lesson row is inserted successfully, then deleted by `syncLessonsOrRollback`. The instructor's calendar is otherwise healthy (632 events synced a minute earlier), so the rollback is discarding good bookings.

## Fix — save and retry instead of rolling back

1. **`src/lib/syncLessonsOrRollback.ts`**
   - On Google failure, do **not** delete the lesson rows. Instead update them with `calendar_sync_status = 'pending'` so the existing `process-calendar-queue` cron retries them.
   - Toast (amber, non-blocking): *"Lesson saved. We'll keep trying to add it to your Google Calendar in the background."*
   - Return `{ ok: true, deferred: true }` so callers proceed as success.

2. **`src/components/instructor/AddLessonSheet.tsx`** (lines ~707–712 and ~781–785)
   - Remove the "slot released" early return.
   - On a deferred sync, still show the success toast, close the sheet, call `onSuccess`, invalidate queries.

3. **`src/components/course-planner/CoursePlannerForm.tsx`** and **`src/components/instructor/VoiceQuickAddLessonSheet.tsx`**
   - Same call-site change so course planner and the voice quick-add behave identically.

4. **No edge-function or DB changes.** `process-calendar-queue` already picks up `pending`/`failed` rows on its cron schedule.

5. **Quiet fix:** `src/components/instructor/payments/SendAllRemindersDialog.tsx` still references `emptyChannelLabel` (removed in the previous refactor) and crashes the reminders dialog. Drop the stray reference.

## Why this is safe

The availability engine consults Google Calendar + `instructor_manual_blocks` for busyness — not `scheduled_lessons` — so a briefly-unsynced lesson can theoretically let the engine offer that slot. But:
- The cron retry usually syncs within seconds.
- The instructor sees an explicit "still syncing" toast.
- Losing the booking entirely (current behaviour) is strictly worse than a short retry window.

## Files touched
- `src/lib/syncLessonsOrRollback.ts`
- `src/components/instructor/AddLessonSheet.tsx`
- `src/components/course-planner/CoursePlannerForm.tsx`
- `src/components/instructor/VoiceQuickAddLessonSheet.tsx`
- `src/components/instructor/payments/SendAllRemindersDialog.tsx`
