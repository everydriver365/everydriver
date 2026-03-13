

## Fix: Google Calendar and In-App Schedule Not Updating After Course Booking

### Root Cause

The `trigger_calendar_sync` database trigger correctly fires when lessons are inserted into `scheduled_lessons`, adding entries to `calendar_sync_queue`. However, **the `process-calendar-queue` edge function is never called** — there is no cron schedule, no invocation from the booking flow, and no entry in `config.toml` for it. The queue items just sit there unprocessed.

The in-app calendar (e.g. `ScheduleDayTabs`) reads directly from `scheduled_lessons`, so it should update — but if the user is an instructor viewing their own schedule, the data won't refresh until they navigate away and back. The booking is created via a public edge function (service role), so there's no realtime subscription or cache invalidation triggered for the instructor's view.

### Solution

**1. Call `process-calendar-queue` immediately after booking creation** — in `create-booking/index.ts`, after lessons are created, invoke `process-calendar-queue` to flush the sync queue right away. This replaces the current no-op comment on line 247.

**2. Add `process-calendar-queue` to `config.toml`** — register the function with `verify_jwt = false` so it can be called from other edge functions.

**3. Optionally set up a cron schedule** — as a fallback to catch any missed syncs (e.g. from manual lesson edits), add a pg_cron job that calls `process-calendar-queue` every 5 minutes.

### Changes

| File | Change |
|------|--------|
| `supabase/functions/create-booking/index.ts` (lines 236-252) | Replace the no-op comment with an actual call to `process-calendar-queue` using `fetch()` with service role auth |
| `supabase/config.toml` | Add `[functions.process-calendar-queue]` with `verify_jwt = false` |
| New migration | Add a `pg_cron` job to call `process-calendar-queue` every 5 minutes as a fallback |

### Key Code Change — `create-booking/index.ts`

```typescript
// 7. Sync lessons to Google Calendar — flush the queue now
try {
  const syncResponse = await fetch(
    `${supabaseUrl}/functions/v1/process-calendar-queue`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({}),
    }
  );
  const syncResult = await syncResponse.json();
  console.log("Calendar queue processed:", syncResult);
} catch (calendarError) {
  console.error("Calendar sync error (non-fatal):", calendarError);
}
```

This ensures Google Calendar events are created immediately when a course is booked, and the cron fallback catches anything that slips through.

