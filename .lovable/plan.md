

## Analysis: Cancelled Lessons and Google Calendar

### Current Behaviour (Bug)

When a lesson is cancelled, the code sets `status = 'cancelled'` on the row. This triggers the database `trigger_calendar_sync()` function, which queues a **`syncLesson`** action — not a `deleteLesson`. The queue processor then **updates** the Google Calendar event with the same details, leaving it visible on the instructor's Google Calendar as though the lesson is still happening.

The `deleteLesson` action only fires on actual row deletion (`DELETE`), which never occurs during cancellation.

**In the app schedule**, cancelled lessons are correctly hidden (all queries use `.neq("status", "cancelled")`).

### Fix

Modify `supabase/functions/process-calendar-queue/index.ts` so that when `syncLesson` runs and the lesson has `status = 'cancelled'`, it **deletes the Google Calendar event** instead of updating it, then clears the `google_event_id` on the lesson row.

Specifically, in the `syncLesson` branch (~line 273), after fetching the lesson, add a check:

```text
if (lesson.status === 'cancelled' && lesson.google_event_id) {
  → delete the Google event
  → clear google_event_id on the row
  → continue to next queue item
}
```

This is a single-file change to the edge function. No database migration needed, no new components, no frontend changes.

### What This Fixes
- Cancelled individual lessons will be removed from Google Calendar
- Cancelled course lessons (which also set `status = 'cancelled'`) will likewise be removed
- The existing trigger already fires on status changes, so no trigger modifications needed

