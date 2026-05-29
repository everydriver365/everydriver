# Hide soft-deleted records globally

## Problem

`pupils`, `scheduled_lessons`, `lesson_packages`, `notes`, and `messages` all have a `deleted_at` column for soft deletes. Today, **only a handful of queries** add `.is("deleted_at", null)`. Across the codebase there are ~205 pupil reads and ~223 scheduled-lesson reads that do not filter — so soft-deleted pupils and lessons can still appear in dashboards, search, the diary, reports, gap-fill, voice assistant, mobile home, automations, etc.

Patching 400+ call sites is fragile and easy to regress. The correct fix is to enforce it once, at the database layer.

## Approach: enforce at RLS, not in every query

Update each table's SELECT policies so the "normal" viewer policy returns only rows where `deleted_at IS NULL`. Add a separate, narrower policy that lets the admin trash/restore UI still see deleted rows.

This is a pure data-access tightening — no client code needs to change for the fix to take effect, and existing `.is("deleted_at", null)` calls keep working unchanged.

## Tables & policy changes

For each table below: drop the existing SELECT policy and recreate it with a `deleted_at IS NULL` clause. Add a second admin-only policy for full visibility (used by trash/recovery screens).

1. **`pupils`**
   - `Instructors can view their own pupils` → add `AND deleted_at IS NULL`
   - `Pupils can view their own row` → add `AND deleted_at IS NULL`
   - New: `Admins can view deleted pupils` — `has_role(auth.uid(),'admin')` (no deleted filter)

2. **`scheduled_lessons`**
   - `Instructors view own scheduled lessons` → add `AND deleted_at IS NULL` to the instructor branch; keep admin branch unrestricted (admin already sees everything).
   - Pupil-side SELECT policies (if any) → add `AND deleted_at IS NULL`.

3. **`lesson_packages`**
   - Existing policy already filters `is_active = true`; also require `deleted_at IS NULL`.
   - Add instructor/admin policies that don't filter, for management screens.

4. **`notes`**
   - `Instructors can read pupil notes for their pupils` → add `AND deleted_at IS NULL`.

5. **`messages`**
   - `pupils_read_own_messages` → add `AND deleted_at IS NULL`.
   - Add equivalent filter to any instructor message SELECT policies that exist.

No table grants or auth changes — only `DROP POLICY` / `CREATE POLICY` statements in a single migration.

## Out of scope (intentionally)

- `status = 'cancelled'` lessons are **not** soft-deletes (they're real, surfaced events) — left alone. The Calendar Sync tile already handles that separately.
- `pupils.status` (active/dormant/etc.) is a lifecycle state, not deletion — left alone.
- Edge functions running with `service_role` bypass RLS by design (sync jobs, payouts, MTD exports) — they continue to see all rows, which is correct.
- Trash/restore UIs that need deleted rows will continue to work for admins via the new admin policies. The one instructor-facing trash view in `PupilRecordsManager` already runs under admin context.

## Verification

After the migration:
1. Soft-delete a test pupil → confirm they disappear from: instructor home, diary, pupils list, voice assistant, gap-fill, header search, reports.
2. Soft-delete a scheduled lesson → confirm it's gone from diary, next-lesson card, earnings, calendar sync counts.
3. Admin trash view still shows the deleted records and can restore them.

## Technical notes

- All policy changes go in **one migration** so the app is never in a half-filtered state.
- Existing redundant `.is("deleted_at", null)` filters in client code remain — they're now belt-and-braces and harmless.
- No code edits required for the fix itself; only the migration.
