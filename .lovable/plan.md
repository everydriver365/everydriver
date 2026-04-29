# EOL Audit Log

Track every "Done" tap at the end of the End Lesson wizard, including when `lesson_history` and `lesson_feedback` rows were created. Surface the trail in both the instructor portal (own activity) and admin portal (all instructors).

## Approach

Reuse the existing `data_audit_log` table — it already has instructor-scoped RLS, an `insert` action, and a `new_values` jsonb column for metadata. No schema changes required.

When the user taps **Done** in `EndLessonWizard.handleDone`, after the inserts succeed we write two audit rows (one per table), both tagged with the wizard finish event so they can be grouped.

Each audit row's `new_values` carries:
- `event: "eol_done"`
- `lesson_history_id`
- `lesson_feedback_id` (null if feedback was disabled or insert failed)
- `pupil_id`, `pupil_name`
- `lesson_date`, `start_time`, `duration_minutes`
- `voice_note_attached: boolean`
- `auth_user_id` (who tapped Done)
- `client_completed_at` (ISO timestamp)

If either insert fails, we still log a row with `action: "insert"` and `new_values.error: "<message>"` so failures are visible in the audit too.

## Changes

### 1. Logging hook in the wizard
`src/components/instructor/EndLessonWizard.tsx` — inside `handleDone`, after the `lesson_history` and `lesson_feedback` inserts, call `logAudit` (existing helper in `src/lib/auditLogger.ts`) twice:
- One row with `table_name: "lesson_history"`, `record_id: historyData.id`, full metadata payload.
- One row with `table_name: "lesson_feedback"`, `record_id: feedbackData.id` (or the history id with `note: "feedback_disabled"` if skipped).

Wrap in try/catch — audit failure must never block the wizard close.

### 2. Instructor portal viewer
New component `src/components/instructor/EOLAuditLog.tsx`:
- Lists this instructor's `data_audit_log` rows where `new_values->>event = 'eol_done'`, newest first, paginated 25 at a time.
- Each row shows: pupil name, lesson date/time, duration, "Done tapped" timestamp (relative + absolute on hover), small chips for "feedback requested" / "voice note" when present, and the `lesson_history_id` short hash.
- Filter chips: All / Today / Last 7 days / Last 30 days, and a pupil filter.

Mount it inside the existing **Lesson History** screen (`src/components/instructor/LessonHistory.tsx`) as a new tab/section called "EOL Activity", so it lives alongside the lessons themselves.

### 3. Admin portal viewer
New page `src/pages/admin/EOLAuditLog.tsx` + route `/admin/eol-audit`:
- Same query, but unscoped (admin RLS already grants read on `data_audit_log` via `has_role(_, 'admin')` — verify; if not, add a SELECT policy in this migration).
- Columns: instructor name, pupil name, lesson date, duration, Done timestamp, feedback chip, voice-note chip, lesson_history_id.
- Filters: instructor (searchable select), date range, "feedback enabled only".
- Add a link card to `AdminPortal` in the existing dashboard grid, plus the lazy import in `src/routes/adminRoutes.tsx`.

### 4. RLS for admin read access
Quick check shows `data_audit_log` only has instructor-scoped policies. Add one migration:

```sql
CREATE POLICY "Admins can view all audit logs"
  ON public.data_audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
```

No other schema changes.

## Technical details

- `logAudit` signature already accepts arbitrary `newValues`, so no helper changes needed.
- The audit insert is fire-and-forget (existing helper swallows errors and logs to console) — wizard close path is unaffected.
- Pupil name comes from the wizard's existing `pupilName` prop, so no extra join at write time.
- Both viewers query `data_audit_log` filtered with `new_values->>event = 'eol_done'`. Index `idx_audit_log_instructor (instructor_id, created_at DESC)` already covers the instructor view; admin view scans by `created_at DESC` which is acceptable at expected volumes (1–2 rows per completed lesson).
- Admin viewer joins instructor name client-side from a single `instructors` fetch (id → name map), keeping the audit query a single round-trip.
- No edge functions, no new tables, no new secrets.

## Out of scope
- Editing past audit rows.
- Tracking partial wizard state (Step 1/2/3 events) — only the final "Done" tap is logged.
- Exporting to CSV (can be added later if needed).
