## Why the 0900 lesson is still there

The lesson at 09:00 today (`b3839320…`) was created on **May 6** with `calendar_sync_status = 'pending'` and **was never pushed to Google Calendar** — its `google_event_id` is `NULL`. So whatever you deleted in Google this morning wasn't this lesson; the app and Google were never linked for it. The reconcile job correctly skipped it (no Google ID to compare).

Diagnosis turned up two real problems:

1. **17 lessons across the next 30 days are stuck** (`12 pending`, `5 failed`) and the 0900 lesson is one of them.
2. On **2026-05-26**, the calendar queue logged **211 consecutive failures** with `invalid_grant: Invalid JWT Signature` — the Google service-account JWT signing broke for a window. Those queue rows were marked `processed` with an error and never retried, stranding the lessons. New webhooks are healthy now, but nothing pulls the stragglers forward.
3. The 0900 lesson has **zero rows in `calendar_sync_queue`** — so even a working queue worker would never touch it. There's no orphan-rescue path.

## Plan

### 1. One-off backfill (immediate)

- Find every `scheduled_lessons` row with `deleted_at IS NULL`, `lesson_date >= today`, `status = 'scheduled'`, and `calendar_sync_status IN ('pending','failed')`.
- Insert a fresh `syncLesson` row into `calendar_sync_queue` for each (dedupe-safe: queue already dedupes per-lesson on the next run).
- Manually invoke `process-calendar-queue` once and confirm `google_event_id` populates for the 0900 lesson and the rest.

### 2. Make the queue self-healing

Edit `supabase/functions/process-calendar-queue/index.ts`:

- **Add retry semantics.** Add `attempt_count` + `next_retry_at` columns to `calendar_sync_queue` (migration). On failure, don't mark processed — increment `attempt_count`, set `next_retry_at = now() + backoff` (e.g. 1m, 5m, 30m, 2h, 6h). Only mark processed after `attempt_count >= 6`. Queue fetch filter becomes `processed_at IS NULL AND (next_retry_at IS NULL OR next_retry_at <= now())`.
- **Add orphan sweep.** Before returning, query `scheduled_lessons` where `deleted_at IS NULL`, `lesson_date BETWEEN today AND today+30`, `status = 'scheduled'`, `calendar_sync_status IN ('pending','failed')`, and **no unprocessed queue row exists**. Enqueue a fresh `syncLesson` row for each. This is what catches the 0900-style orphans permanently.
- **Reduce noisy alerts.** Only `raiseSyncAlert` after final retry exhaustion, not on every transient failure (today the May-26 outage would have raised 211 alerts).

### 3. Verify the cron

- Confirm a `pg_cron` job invokes `process-calendar-queue` (suspect cadence; the May-26 backlog suggests it ran but couldn't recover). If missing or > every 5 minutes, schedule it `*/2 * * * *`.

## Technical details

**Files**
- `supabase/functions/process-calendar-queue/index.ts` — retry logic + orphan sweep + alert gating.
- `supabase/migrations/<timestamp>_calendar_queue_retry.sql` — add `attempt_count int default 0`, `next_retry_at timestamptz`.
- `supabase/insert` — one-off `INSERT INTO calendar_sync_queue` backfill for the 17 stuck lessons.
- `supabase/insert` — `cron.schedule(...)` if the existing job is missing or too slow.

**Files NOT touched**
- `google-calendar-webhook/index.ts`, `reconcile-google-calendar/index.ts` — the inbound-delete fix from the previous turn is correct; the issue here is outbound and queue mechanics.
- `sync-lesson-now`, `_shared/googleCalendarSync.ts` — sync logic itself works; the May-26 JWT outage was credential-side.

**Out of scope (ask if wanted)**
- UI badge in the schedule for "not synced to Google" so silent failures become visible to the instructor.
