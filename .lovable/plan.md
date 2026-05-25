## Goal

Fix the broken Google Calendar push sync and add a complete admin alerting system so any failure (key decode, 401, 429, webhook, orphan, stuck queue) is surfaced immediately — never silent.

## Scope

### 1. Fix the root cause (push sync)

- Harden `importPrivateKey` in `supabase/functions/_shared/googleCalendarSync.ts`:
  - Strip wrapping quotes, BOM, and stray whitespace.
  - Accept full service-account JSON OR raw PEM block.
  - Handle both `\n` escapes and real newlines.
  - Detect doubly base64-encoded payloads and decode one extra layer.
  - Replace the generic `Failed to decode base64` with a clear, actionable message.
- Replay stuck lessons: re-enqueue all `calendar_sync_status = 'failed'` rows after the fix lands.

### 2. New alerting infrastructure

**New table `google_sync_alerts`:**
- `id`, `instructor_id` (nullable for system-wide), `lesson_id` (nullable), `severity` (`critical` | `high` | `medium`), `category` (`key_decode` | `auth_401` | `rate_limit_429` | `webhook` | `orphan_lesson` | `queue_stuck` | `other`), `title`, `message`, `metadata` (jsonb), `resolved_at`, `resolved_by`, `created_at`.
- RLS: admins only (`has_role(auth.uid(), 'admin')`).
- Indexes on `(resolved_at, severity, created_at desc)`.

**`raiseSyncAlert` helper (`supabase/functions/_shared/raiseSyncAlert.ts`):**
- Inserts a row into `google_sync_alerts` using the service-role client.
- Wrapped in try/catch so a logging failure NEVER breaks the calling sync code.
- Deduplicates: if an unresolved alert with the same `(category, instructor_id, lesson_id)` already exists in the last hour, increment its `metadata.count` instead of inserting a new one.
- Dispatches:
  - Email to admin via `send-transactional-email` (template `google-sync-alert`) for `critical` and `high`.
  - Push notification to admin devices via existing `notify-admin-*` pattern for `critical` only.

### 3. Wire alerts into every failure point

| Failure | Where | Severity |
|---|---|---|
| `GOOGLE_PRIVATE_KEY` decode fails | `importPrivateKey` | critical |
| Google returns 401 (auth) | `googleCalendarSync.ts` token mint | critical |
| Google returns 429 (rate limit) | sync call sites | high (with `Retry-After` recorded) |
| Webhook / push channel failure | `google-calendar-service` | high |
| Orphan lesson detected (no `google_event_id` after sync) | `process-calendar-queue` | medium |
| Queue stuck (>50 pending older than 15 min) | new check in `check-calendar-sync-failures` | critical |
| `service-account-not-configured` while instructor still connected | `sync-lesson-now` | high |

### 4. 429 backoff

Add `Retry-After`-aware backoff in `process-calendar-queue` so we honour Google's rate limit instead of hammering it.

### 5. Admin UI

New panel `src/components/admin/GoogleSyncAlertsPanel.tsx` (mounted on the admin dashboard alongside `SOSAlertsPanel` and `AdminAlerts`):
- Red badge with unresolved count.
- Severity-coloured rows (critical = red, high = orange, medium = amber).
- Filters: All / Unresolved / By severity / By category.
- Each row shows: title, message, instructor name (if any), lesson link (if any), occurrence count, first-seen + last-seen timestamps.
- "Mark resolved" button (single + bulk).
- Realtime subscription to `google_sync_alerts` so new failures appear without refresh.

### 6. Cron

- Extend `check-calendar-sync-failures-daily` to also raise alerts for:
  - Orphan lessons (no `google_event_id`, not cancelled, in future).
  - Stuck queue rows.
- Add hourly run (in addition to daily) for stuck-queue detection.

## Out of scope

- No changes to the pull side (`google-calendar-service` external event sync) beyond adding alert hooks.
- No instructor-facing UI changes.
- No schema changes to `scheduled_lessons` or `calendar_sync_queue`.
- No replacement of service-account architecture with per-user OAuth.

## Verification

1. Add a test lesson on mobile — appears in Google Calendar within seconds.
2. `calendar_sync_queue` shows no new `Failed to decode base64` rows.
3. Force a failure (e.g. temporarily bad key in staging) → alert appears in admin panel, email arrives, push fires.
4. Repeat the same failure 10× → single alert row with `count: 10`, not 10 rows.
5. Mark resolved → row disappears from unresolved view.

## Technical notes

- `raiseSyncAlert` must use the service-role client and never `throw` — wrap the whole body in try/catch and `console.error` on failure.
- Email template `google-sync-alert` to be scaffolded via the transactional email tool after migration approval.
- Reuse existing `admin_alerts` realtime pattern from `SOSAlertsPanel` for the UI.
- Dedup key: `md5(category || ':' || coalesce(instructor_id::text,'') || ':' || coalesce(lesson_id::text,''))` stored as `dedupe_key` column with partial unique index `WHERE resolved_at IS NULL`.

Ready to implement once approved.
