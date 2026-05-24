## Booking flow fixes — critical + high + medium

Execute strictly in order. After each fix, verify build is clean before proceeding.

---

### Fix 1 — Critical: `clash_overridden` audit

**Investigation findings (already gathered, will report in-line during execution):**
- Active duplicate `(instructor_id, pupil_id, lesson_date, start_time)` rows in `scheduled_lessons` (excluding cancelled/deleted/completed): **0**.
- Rows with `clash_overridden = true AND status NOT IN (cancelled, completed) AND deleted_at IS NULL`: **0**.
- Codebase references to `clash_overridden`: **none** in `src/**` or `supabase/functions/**`.
- The "4 duplicates" reported in the audit narrative do not currently exist as active rows — they were either cancelled, soft-deleted, or already cleaned. Will re-run the query at execution time and post the live result; if any reappear, will surface in the admin portal flag (below) rather than auto-cancel.

**Action:**
1. Re-query duplicates and `clash_overridden` rows; paste full result.
2. Since `clash_overridden` has zero writers in code and zero active true rows, treat it as a latent legacy field. **Add a migration:** trigger `enforce_clash_override_admin_only` on `scheduled_lessons` BEFORE INSERT/UPDATE — if `NEW.clash_overridden = true` and caller is not `has_role(auth.uid(), 'admin')`, raise exception. Safe because nothing currently sets it.
3. **Admin flag UI:** new admin tile "Duplicate active lessons" that selects from a SQL view `v_duplicate_active_lessons` grouping by `(instructor_id, pupil_id, lesson_date, start_time)` HAVING count > 1. List rows with both lesson IDs and a "Review" link. No auto-cancel.

---

### Fix 2 — High: Pupil self-book notifies instructor

File: `src/components/pupil-portal/SelfBookingCalendar.tsx`

- After successful `scheduled_lessons` insert, call `supabase.functions.invoke('notify-instructor', { body: { type, ... } })` wrapped in try/catch; never block confirmation.
- Type mapping:
  - Confirmed booking → `type: 'new_booking'`.
  - `require_approval = true` (status = `pending_approval`) → `type: 'new_booking'` with `note: 'This booking requires your approval'` (verify `pending_approval` is not a registered type in `notify-instructor`; if it is, use it instead).
- Payload: pupil name, lesson_date, start_time, duration_minutes, lesson_id.
- Verify `PendingBookingsCard.tsx` path: it's an instructor-side approve/decline view, not a booking creator — no notify needed there. If a different component creates pending bookings without notification, patch it the same way.

---

### Fix 3 — High: Orphan `lesson_telematics` (542 rows)

**Investigation (will report inline):**
- Inspect `auto-start-lesson-tracker/index.ts` match logic + time tolerance.
- Inspect `auto-stop-lesson-tracker/index.ts` to confirm whether it attempts a lesson match at stop time (currently believed: no).

**Forward fix — `auto-stop-lesson-tracker`:**
- Before finalising the session, if `lesson_id IS NULL`, query `scheduled_lessons` where:
  - `instructor_id = session.instructor_id`
  - `deleted_at IS NULL AND status NOT IN ('cancelled')`
  - `lesson_date = session.started_at::date` (Europe/London)
  - lesson time window overlaps `[started_at − 30min, ended_at + 30min]`
- If exactly **one** match → set `lesson_id`. If 0 or >1 → leave null, log reason.

**Backfill — new edge function `backfill-telematics-lesson-ids`:**
- Iterate `lesson_telematics WHERE lesson_id IS NULL AND ended_at IS NOT NULL`.
- Same match logic with ±30 min tolerance. Update only on exactly one confident match.
- Return JSON summary: `{ scanned, matched, ambiguous, no_match }`.
- Admin caller-only (verify_jwt + role check).

**Admin UI:** "Backfill telematics" tile (same pattern as the existing Backfill commute mileage tile). Shows last-run summary.

---

### Fix 4 — High: Square webhook idempotency

- Inspect `supabase/functions/square-webhook/index.ts` for any existing `event_id` dedupe.
- **Migration:** create `processed_square_events (event_id text primary key, event_type text, processed_at timestamptz default now())`. RLS enabled, no policies (service role only).
- **Webhook logic:** at the top of the handler, after signature verification, attempt `INSERT ... ON CONFLICT DO NOTHING RETURNING event_id`. If no row returned → already processed → return 200 immediately. Otherwise continue.
- Additive only — no behavioural change for first-delivery events.

---

### Fix 5 — Medium: Pupil portal realtime for new lessons

- `src/pages/PupilPortal.tsx` line ~121 (and `PupilPortalSchedule.tsx` if it has its own subscription): change `event: 'UPDATE'` → `event: '*'` on the `scheduled_lessons` channel; keep `filter: pupil_id=eq.{pupilId}`.

---

### Fix 6 — Medium: Parent portal realtime

- Add a subscription in `ParentPortal.tsx` to `scheduled_lessons` filtered by `pupil_id=eq.{linkedPupilId}` (from existing parent↔pupil resolution). On any event, invalidate the lessons query. Same shape as `useGlobalLessonSync`, scoped.

---

### Fix 7 — Medium: Pupil cancel notifies instructor

- In `PupilPortalSchedule.tsx` cancel handler, after the cancel succeeds, fire `notify-instructor` with `type: 'cancellation'` + pupil name, lesson date/time. Try/catch, non-blocking.
- Verify the pending-approval self-book path from Fix 2 already triggers a notification — if not, ensure it does.

---

### Fix 8 — Medium: Daily alert for failed Google Calendar syncs

- Migration: add `calendar_sync_alerted_at timestamptz` to `scheduled_lessons`.
- New edge function `check-calendar-sync-failures`:
  - Select `scheduled_lessons WHERE calendar_sync_status = 'failed' AND updated_at < now() - interval '1 hour' AND calendar_sync_alerted_at IS NULL AND deleted_at IS NULL AND status <> 'cancelled'`.
  - For each, call `notify-instructor` with `type: 'admin_message'` and the specified copy.
  - Set `calendar_sync_alerted_at = now()` after sending.
- Schedule via `cron.schedule` SQL using the `insert` tool: `0 8 * * *`.

---

### Hard constraints (enforced)

- Fix 1: no auto-cancel; admin-flag UI only.
- Fix 1: post live `clash_overridden` query results before any trigger migration.
- Fix 3: backfill only on exactly one match.
- Fix 4: `processed_square_events` migration is additive.
- Notifications: always try/catch, never block primary action.
- Build clean after each fix.

### Reporting format

Will respond per round as:
`FIX 1 (investigation + change) / FIX 2 / FIX 3 (investigation + auto-stop + backfill) / FIX 4 / FIX 5 / FIX 6 / FIX 7 / FIX 8 / PART 9 verified clean / PART 10 deferred`.

### Out of scope

- DB-level `EXCLUDE USING gist` clash constraint (deferred — needs btree_gist + careful overlap operator design).
- Timezone migration to `timestamptz` (deferred — large blast radius).
- Backfilling existing failed-sync rows older than 1 hour at deploy time (only forward alerting).
