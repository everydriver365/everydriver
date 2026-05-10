## Why this keeps happening

The original symptom (course toggles failing) wasn't a one-off bug. It's the same root cause repeating across the app:

When a table has an `instructor_id` column, instructors need explicit RLS policies that say "you can insert / update / delete rows where `instructor_id = get_instructor_id_for_user(auth.uid())`". Many tables were created with only:

- a `public read` policy (so pupils can see the data), and
- an `admin manage` policy (so support can fix things).

…but no instructor write policies. Result: the UI fires the mutation, RLS silently rejects it (`42501`), the toast says "Failed to…", and the instructor concludes "settings don't work". Because there's no automated check, every one of these is found by a real instructor hitting it in production.

I ran a full audit. There are roughly **30+ instructor-owned tables** with at least one missing write policy (insert/update/delete). Some are intentional (audit logs, system-generated reminders, etc.) — but many are user-facing features.

## What I'll do

### 1. Generate a single, definitive RLS audit

Write `scripts/audit-instructor-rls.ts` that:

- Lists every `public.*` table with an `instructor_id` column.
- Cross-references `pg_policies` to flag tables where an instructor cannot insert / update / delete their own rows.
- Cross-references the codebase: greps `src/` for `.from("<table>").insert/.update/.delete(` calls, so we know which gaps are actually exercised by the UI.
- Outputs `docs/qa/instructor-rls-gaps.md` with three sections:
  - **Critical** — UI writes to it, no policy exists. Will silently fail.
  - **Intentional** — backend-only / service-role tables (annotated, kept gap on purpose).
  - **Read-only by design** — instructor only reads (e.g. `compliance_reminders`).

Run it once, commit the output. From now on I (and you) can re-run it any time and see the truth in one file.

### 2. Fix every "Critical" row in one migration

For each table flagged Critical, add the standard three policies:

```sql
CREATE POLICY "Instructors can insert own <table>"
  ON public.<table> FOR INSERT TO authenticated
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can update own <table>"
  ON public.<table> FOR UPDATE TO authenticated
  USING       (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK  (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can delete own <table>"
  ON public.<table> FOR DELETE TO authenticated
  USING       (instructor_id = public.get_instructor_id_for_user(auth.uid()));
```

I'll show you the exact list before applying — so you can veto anything that should stay locked down.

### 3. Add a lightweight regression guard

Add `scripts/audit-instructor-rls.ts` to a `bun run audit:rls` script in `package.json`. It exits non-zero if any new `instructor_id` table appears in the codebase without matching policies. So the next person (me or a teammate) who creates `instructor_<thing>` and forgets RLS will get an immediate signal, not a customer ticket.

### 4. Fix the silent-failure UX

Even with policies in place, RLS rejections surface as `42501 / new row violates row-level security policy`. That's gibberish to users. Add a small helper `src/lib/supabaseError.ts` with `isRlsError(err)` + `friendlyDbError(err)`, and use it in the 5–6 most-hit instructor mutations (course toggle, profile editor, working hours, manual blocks, calendar overrides, gap offers). On RLS rejection, show: *"Permission denied — please refresh and try again. If it persists, contact support."* Plus log to console with the table + operation so I can find these instantly next time.

## Out of scope (deliberate)

- I won't blanket-add policies to audit / log / system tables — those should stay restricted.
- I won't refactor the underlying tables.
- No mobile layout changes (per project rules).

## Verification

1. Re-run the audit — Critical list is empty.
2. Sign in as Richard and walk through Settings → Profile, Courses, Working Hours, Calendar Overrides, Manual Blocks, Gap Offers. Every save shows a success toast, every row appears in the DB.
3. Force an RLS error in dev (e.g. swap the helper to return null) — confirm the new friendly toast fires instead of `42501`.

## Files

- `scripts/audit-instructor-rls.ts` (new)
- `docs/qa/instructor-rls-gaps.md` (generated, committed)
- one Supabase migration adding the missing policies (after you approve the table list)
- `src/lib/supabaseError.ts` (new) + ~6 callsites updated
- `package.json` — `audit:rls` script
