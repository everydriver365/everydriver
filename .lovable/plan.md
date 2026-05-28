# Why deletes from Google Calendar don't remove items from your schedule

## Diagnosis

The push channel from Google is healthy (your last sync was minutes ago, channel valid until June 2), so notifications **are** arriving. The bug is in what we do with them.

When Google pings us, `google-calendar-webhook` does two things:

1. Refreshes `instructor_calendar_events` (the inbound mirror of your Google calendar) — this DOES correctly remove anything you deleted in Google.
2. Calls `reconcileLessons(...)` to cancel any **pupil lessons** whose Google event is gone.

Two gaps in step 2 cause your symptom:

### Gap 1 — Manual blocks (busy time / personal events you added in the app) are never reconciled

When you add a "block" in the app, we write a row to `instructor_manual_blocks` AND create a matching Google event. If you then delete the event in Google, nothing tells the app — the row stays and keeps appearing on the mobile schedule forever. There's no inbound handler for manual blocks at all (only the outbound `op === "delete"` path in `syncManualBlock`).

### Gap 2 — `reconcileLessons` only looks at lessons from today onward

```ts
.gte("lesson_date", new Date().toISOString().slice(0, 10))
```

Any past or in-progress lesson deleted in Google stays "scheduled" forever. Combined with timezone edge cases around midnight, even some "today" lessons can be missed.

## Fix

Extend the webhook's reconciliation so a Google delete propagates back to **both** sources of schedule items:

1. **Reconcile `instructor_manual_blocks`** in `google-calendar-webhook/index.ts`:
   - Load all manual blocks for the instructor with a non-null `google_event_id` whose `end_datetime >= now()`.
   - For any whose `google_event_id` no longer exists in the freshly-refreshed `instructor_calendar_events`, hard-delete the block (manual blocks have no soft-delete column and the schedule reads the row directly).
   - Invalidate caches via existing realtime publication on `instructor_manual_blocks`.

2. **Widen `reconcileLessons`** in the same file:
   - Replace the `gte("lesson_date", today)` filter with a window of `lesson_date >= now() - interval '7 days'` so recently-completed and in-progress lessons are also caught.
   - Keep the existing `status != cancelled` and `deleted_at IS NULL` guards.

3. **Safety net** — add an hourly `pg_cron` job (or extend the existing renew job) that calls `google-calendar-service` with `action: "fetchExternalEvents"` for each active connection and runs the same two reconciliations. This covers the case where Google's push notification is missed (channel rotation, transient 5xx, etc.) so deletes are never stranded for more than an hour.

## Files touched

- `supabase/functions/google-calendar-webhook/index.ts` — add `reconcileManualBlocks(...)`, widen `reconcileLessons(...)` window.
- `supabase/functions/renew-google-calendar-webhooks/index.ts` — also trigger a reconcile pass per instructor (or new `reconcile-google-calendar` function scheduled hourly).
- One `cron.schedule(...)` insert via the insert tool to wire the hourly safety job.

No DB schema changes, no UI changes.
