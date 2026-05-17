# Lesson Create / Delete Audit

## What I checked

- All call sites that insert, update, soft-delete, or hard-delete `scheduled_lessons`
- DB triggers on the table
- `calendar_sync_queue` worker contract
- `syncLessonNow` (queue worker) cancellation branch
- `resyncRange` (Google → CRM) reconciliation
- Availability RPCs (`get_public_instructor_lesson_geo`, `get_public_scheduled_lesson_blocks`) and engine policy

## Current state — what works

1. **Insert flow** — Client inserts row, calls `sync-lesson-now`, which pushes to Google and mirrors into `instructor_calendar_events`. On failure, `syncLessonsOrRollback` hard-deletes the row so the slot is released. ✓
2. **Cancel flow (`status='cancelled'` via `CancelLessonDialog`)** — Trigger `on_lesson_update_sync_calendar` enqueues `syncLesson`; worker's `syncLessonNow` sees `status='cancelled' && google_event_id` and deletes the Google event + removes from `instructor_calendar_events`. ✓
3. **Hard delete flow** — Trigger `on_lesson_delete_sync_calendar` enqueues `deleteLesson`; worker removes Google event. ✓
4. **Upstream Google delete** — `resyncRange` soft-cancels matching `scheduled_lessons` (`status='cancelled'`, `calendar_sync_status='deleted-from-google'`). ✓
5. **Availability** — Public engine ignores `scheduled_lessons` busyness; only the Google mirror + manual blocks block slots. So once the Google event is gone, the slot is free. ✓

## What is broken / risky

### B1. Soft-delete (`deleted_at`) does NOT free the Google calendar
Nothing in the app currently writes `deleted_at`, but if/when it does:
- The UPDATE trigger queues `syncLesson` (not `deleteLesson`).
- `syncLessonNow` only deletes Google when `status='cancelled'`. It does not check `deleted_at`.
- Result: soft-deleted row stays on Google → mirror keeps blocking the slot.

### B2. Hard-delete call sites bypass audit trail
`syncLessonsOrRollback`, `create-booking`, `ai-command-center` rollbacks, `useOfflineMutation`, and the admin "reset" all do `.delete()`. Rollbacks are fine, but there is no consistent rule across the codebase. Today's mix means we can't tell from history why a row vanished.

### B3. Queue backlog risk
`calendar_sync_queue` currently shows 10 unprocessed `syncLesson` rows. A cancellation enqueues a `syncLesson` and waits for the worker — so a stalled worker = stale Google event = phantom busy slot. There is no fallback that calls `sync-lesson-now` synchronously on cancel like we do on insert.

### B4. `prevent_lesson_clash` ignores `deleted_at` correctly but `status='cancelled'` is allowed
Confirmed clash check skips cancelled / soft-deleted rows. ✓ No bug, noting for completeness.

### B5. `awaiting_initial_payment` rows
If a row is created with `awaiting_initial_payment=true`, `syncLessonNow` skips Google entirely. If the payment never lands and the row is later deleted, the trigger queues `deleteLesson` — but there is no Google event to delete (no-op). Mirror is clean. ✓ But if it's soft-deleted (B1) the row sticks around with no calendar artifact, which is fine for availability today (engine doesn't consult `scheduled_lessons`) but inconsistent with B1.

## Fix plan

### Fix 1 — Treat soft-delete and cancel identically in the sync pipeline
- DB trigger `trigger_calendar_sync()`: when UPDATE sets `deleted_at IS NOT NULL` (was NULL), enqueue `deleteLesson` instead of `syncLesson`.
- `syncLessonNow`: extend the cancellation guard to `(status='cancelled' OR deleted_at IS NOT NULL) && google_event_id` → delete Google event + clear mirror.
- `resyncRange` (Google → CRM): when an event disappears upstream, *soft*-delete (`deleted_at=now()`) instead of (or in addition to) `status='cancelled'`, so both signals stay aligned.

### Fix 2 — Synchronous Google delete on cancel
Mirror the create path: after the `UPDATE … status='cancelled'` in `CancelLessonDialog` (and any "delete lesson" UI), invoke `sync-lesson-now` directly so the Google event is removed in-line. The queue trigger remains as a safety net. This eliminates B3 for the user-visible action.

### Fix 3 — Standardise the rollback vs delete distinction
- Rollback paths (failed Google sync) keep using `.delete()` — the row was never real.
- Any user-initiated "delete a confirmed lesson" must go through a single helper (`softDeleteLesson(id)`) that sets `deleted_at = now()` + `cancelled_by` + reason, then calls `sync-lesson-now`. Replace ad-hoc deletes in `useOfflineMutation` and admin reset accordingly (admin reset can keep hard-delete behind an explicit "wipe data" flag).

### Fix 4 — Queue worker health
- Add a cron-driven retry pass over `calendar_sync_queue WHERE processed_at IS NULL AND created_at < now() - interval '2 minutes'`.
- Surface backlog count in the instructor health tile so a stalled worker is visible.

### Fix 5 — One-off cleanup
- Find rows with `status='cancelled'` or `deleted_at IS NOT NULL` that still have a `google_event_id` and a live mirror row → re-enqueue `deleteLesson` for each.
- Find mirror rows whose Google event no longer exists → already handled by `resyncRange`; trigger a manual resync for the affected instructors.

## Files that will change

- `supabase/migrations/<new>.sql` — update `trigger_calendar_sync()` (soft-delete → `deleteLesson`); cleanup script for orphan google_event_ids.
- `supabase/functions/_shared/googleCalendarSync.ts` — broaden cancellation branch to include `deleted_at`.
- `supabase/functions/google-calendar-service/index.ts` — `resyncRange` writes `deleted_at` alongside `status='cancelled'`.
- `src/lib/softDeleteLesson.ts` (new) — single entry point: soft-delete row + invoke `sync-lesson-now`.
- `src/components/instructor/CancelLessonDialog.tsx` — invoke `sync-lesson-now` immediately after update.
- `src/hooks/useOfflineMutation.ts` + any other lesson "delete" UI — route through the new helper.
- Optional cron migration for queue retry.

## Validation

1. Soft-delete a synced lesson → confirm Google event removed within seconds, mirror row gone, slot bookable.
2. Cancel via dialog with a stalled worker → confirm in-line sync still removes Google event.
3. Delete event directly in Google → confirm `resyncRange` sets both `deleted_at` and `status='cancelled'` on the CRM row.
4. Re-run cleanup query: zero rows with cancelled/deleted status + live `google_event_id`.
