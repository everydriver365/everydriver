# Synchronous Google Calendar Writes

Make Google Calendar the *enforced* source of truth: every lesson that lands in the DB must also exist in the instructor's Google Calendar by the time the user sees a "success" response. If the Google API call fails, the lesson is removed and the user is told.

## Why this matters

Today every `scheduled_lessons` insert just enqueues a job into `calendar_sync_queue`, processed asynchronously by `process-calendar-queue` (cron + ad-hoc triggers). Because the availability engine now ignores `scheduled_lessons` and only looks at Google + manual blocks, the gap between the DB insert and the Google push leaves a slot briefly double-bookable. This plan closes that gap.

## Architecture

```text
                ┌──────────────────────────────────────────────┐
                │ _shared/googleCalendarSync.ts (new)          │
                │   • generateJWT / getAccessToken             │
                │   • createGoogleEvent / update / delete      │
                │   • syncLessonNow(lessonId) → eventId|throws │
                └──────────────────────────────────────────────┘
                          ▲                ▲                ▲
                          │                │                │
        create-booking ───┤   confirm-bk ──┤   sync-lesson-now (new)
        (£0 bookings)         (paid bookings)    (manual inserts)
                          │
                  process-calendar-queue (keeps existing fallback role)
```

Existing async queue stays in place as a safety net for retries and for any path we miss, but it is no longer the *primary* mechanism.

## Changes

### 1. Extract shared helper — `supabase/functions/_shared/googleCalendarSync.ts`

Move the following out of `process-calendar-queue/index.ts` into a shared module:

- `importPrivateKey`, `generateJWT`, `getAccessToken`
- `createGoogleEvent`, `updateGoogleEvent`, `deleteGoogleEvent`
- New high-level `syncLessonNow(supabase, lessonId)`:
  1. Fetch lesson + pupil + instructor's `calendar_id` from `instructor_google_service_calendar`.
  2. If no active calendar → return `{ skipped: true, reason: 'no-calendar' }` (don't fail — instructor hasn't connected Google).
  3. Build event payload (same shape as today).
  4. Re-fetch `google_event_id` for idempotency; update if present, else create.
  5. Write `google_event_id` back to the lesson row.
  6. Insert a corresponding row into `instructor_calendar_events` immediately so the availability engine sees it without waiting for the next pull-sync. Use `google_event_id` as the unique key (upsert).
  7. Return `{ ok: true, eventId }` or throw on Google API failure.

`process-calendar-queue` is refactored to import from this module — no behaviour change there.

### 2. `create-booking` — synchronous push for £0 bookings

Today the function inserts lessons with `awaiting_initial_payment = true` for any paid booking and lets `confirm-booking` flush the queue after payment. Only £0 ("Free") bookings sync immediately.

Change: after the `lessonInserts` succeed, if `booking.totalPrice === 0`:

- For each new lesson, call `syncLessonNow`.
- If any throw, roll back: delete the new lesson rows (`scheduled_lessons` `.in('id', newIds)`), delete the pupil row, return `502` with `{ error: 'CALENDAR_SYNC_FAILED', message }`.
- If all succeed, continue with the existing notification path.

Paid bookings continue to defer to `confirm-booking` (cannot reject after payment is captured — see step 3).

### 3. `confirm-booking` — synchronous push after payment

Replace the current async `process-calendar-queue` trigger with synchronous `syncLessonNow` for every lesson belonging to the pupil:

- After clearing `awaiting_initial_payment`, fetch the lesson IDs.
- Call `syncLessonNow` for each, collect failures.
- If any fail: do **not** delete the lessons (money was taken). Instead:
  - Mark each failed lesson `calendar_sync_status = 'failed'` (new column, see step 6).
  - Insert a row into `calendar_sync_queue` for the cron to retry.
  - Send the instructor an in-app alert + email: "Booking succeeded but couldn't add to your Google Calendar — please check your connection."
  - Return `{ success: true, calendarSyncFailed: true, lessonsFailed: [...] }` so the client can surface a soft warning.

This means once payment is captured we never "reject" the booking, but we surface the problem loudly and the queue retries it.

### 4. New edge function — `sync-lesson-now`

Single-purpose endpoint for manual inserts initiated from the instructor portal:

- `POST { lessonId }` → calls `syncLessonNow` → returns `{ ok, eventId }` or `502 { error }`.
- Validates that the caller's `auth.uid()` maps (via `get_instructor_id_for_user`) to the lesson's `instructor_id`.

### 5. Client-side manual insert callers

For each of these, change the insert flow to: insert → call `sync-lesson-now` → on failure, delete the row and toast the error:

- `src/components/instructor/AddLessonSheet.tsx`
- `src/components/instructor/VoiceQuickAddLessonSheet.tsx`
- `src/components/instructor/end-lesson/StepBookNext.tsx`
- `src/components/course-planner/CoursePlannerForm.tsx`
- `supabase/functions/ai-command-center/index.ts` (server-side, calls helper directly)
- `src/hooks/useOfflineMutation.ts` — special case: queue locally if offline, retry sync when online; only delete the row if the eventual sync fails permanently. Existing offline UX preserved.

Toast copy on failure (single source): *"Couldn't add lesson to your Google Calendar — the slot has been released. Check Settings → Integrations."*

### 6. DB migration

```sql
ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS calendar_sync_status TEXT
    DEFAULT 'pending' CHECK (calendar_sync_status IN ('pending','synced','failed','no-calendar'));

CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_sync_status
  ON public.scheduled_lessons (calendar_sync_status)
  WHERE calendar_sync_status IN ('pending','failed');
```

`syncLessonNow` writes this field on every attempt. The async queue path also updates it.

### 7. Keep the existing DB trigger + queue

The `AFTER INSERT/UPDATE/DELETE` trigger on `scheduled_lessons` that pushes into `calendar_sync_queue` stays. It now plays a fallback role: anything the synchronous path missed (race conditions, network blips, edge function cold-start failures) still gets reconciled within a minute by the cron.

### 8. Memory update

Update `mem://constraints/google-calendar-source-of-truth`: add that every write path (online booking, manual insert, AI command centre) now performs a synchronous Google push and rolls back the DB row if Google rejects.

## Edge cases & decisions

- **Instructor hasn't connected Google Calendar** → `syncLessonNow` returns `{ skipped: true, reason: 'no-calendar' }`. Lesson is kept (no Google means nothing to enforce against). `calendar_sync_status = 'no-calendar'`. Availability engine has no Google data for them anyway, so this is consistent.
- **Google API 5xx / timeout (paid booking)** → money already taken; we keep the lesson, mark `calendar_sync_status = 'failed'`, enqueue retry, alert instructor. We do NOT auto-refund — that's a manual instructor decision.
- **Google API 5xx / timeout (£0 booking or manual insert)** → roll back, return error.
- **Bulk inserts (course planner: 20+ lessons)** → push in series with `Promise.allSettled` semantics: if any fail, roll back the whole batch and surface a list. Sequential not parallel, to stay under Google's 5 req/s per-user quota.
- **Latency** → adds ~300-800ms per lesson to manual insert flow. Acceptable; user already waits for the DB round-trip. Course planner with 20 lessons ≈ 6-15s; we show a progress indicator.

## Files touched

- `supabase/functions/_shared/googleCalendarSync.ts` (new)
- `supabase/functions/create-booking/index.ts`
- `supabase/functions/confirm-booking/index.ts`
- `supabase/functions/process-calendar-queue/index.ts` (refactor only)
- `supabase/functions/sync-lesson-now/index.ts` (new)
- `supabase/functions/ai-command-center/index.ts`
- `src/components/instructor/AddLessonSheet.tsx`
- `src/components/instructor/VoiceQuickAddLessonSheet.tsx`
- `src/components/instructor/end-lesson/StepBookNext.tsx`
- `src/components/course-planner/CoursePlannerForm.tsx`
- `src/hooks/useOfflineMutation.ts`
- One DB migration (sync status column)
- `mem://constraints/google-calendar-source-of-truth`

## Out of scope

- Refund flows when payment succeeds but calendar fails — surfaced to instructor only.
- Per-pupil travel time on Google events (still no pupil context on Google).
- Pushing `instructor_manual_blocks` into Google (stays a local-only mechanism).
