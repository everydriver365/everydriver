## Goal

Stop duplicate pupil records from being created, and clean up the existing Joseph Thorne duplicate.

## Audit result

I ran a project-wide scan for active pupils sharing the same `(instructor_id, lower(trim(name)))`. **Joseph Thorne is the only duplicate in the entire database** (1 duplicate group, 1 row to remove). Good news — this hasn't been "happening again" elsewhere; it's a single recurrence of the same record.

## What I'll do

### 1. Clean up Joseph Thorne

Soft-delete the empty January record, keep the active May record.

- **Keep:** `53011379-5cf6-4385-9e9c-544d3e9ae961` (created 19 May 2026, 7 scheduled lessons, 3 payments, £1,487.50 balance).
- **Soft-delete:** `383c3edb-bd9c-4247-94e0-396326c5837b` (created 24 Jan 2026, 0 lessons, 0 payments, £1,487.50 balance).

Note on the balance: both rows show £1,487.50. The January record has no payment history backing it, so the balance is almost certainly a stale/manual value. The May record is the real ledger (it has the 3 payments). I will **not** add the January balance into the May one — that would double-count. If you know otherwise, tell me and I'll add them.

Soft-delete = `deleted_at = now()`, `status = 'archived'`. Reversible if needed.

### 2. Add a database guard

Create a partial unique index on `pupils` so two active rows can't share the same instructor + name again:

```sql
CREATE UNIQUE INDEX pupils_unique_active_name_per_instructor
  ON public.pupils (instructor_id, lower(trim(name)))
  WHERE deleted_at IS NULL;
```

- Scoped to active (non-deleted) rows only, so historical archives don't block re-adds.
- Case- and whitespace-insensitive ("joseph thorne" = "Joseph Thorne ").
- Future duplicate insert/update attempts will fail at the DB with a clear unique-violation error, which the Add Pupil dialog will surface as a toast.

### 3. Front-end duplicate check (defence in depth)

In the Add Pupil flow (`AddPupilDialog` / equivalent), before insert, run a lookup:

```ts
const { data: existing } = await supabase
  .from("pupils")
  .select("id, name")
  .eq("instructor_id", instructorId)
  .is("deleted_at", null)
  .ilike("name", trimmedName.trim())
  .maybeSingle();
```

If a match exists, show a confirm dialog: *"A pupil called 'Joseph Thorne' already exists. Open existing pupil / Add anyway / Cancel."* "Add anyway" is disabled (DB index will reject it).

This catches the duplicate before the DB error, gives a friendlier UX, and lets the instructor jump straight to the existing record.

## Out of scope

- No changes to other portals, payments, or business logic.
- No merging of historical data between the two Joseph records (the older one has none worth keeping).
- No change to pupils intentionally re-added after being archived — the partial index allows that.

## Verification

1. Re-run the duplicate-scan query → expect 0 groups.
2. Open Joseph Thorne in the Pupils list → exactly one row, with 7 lessons and 3 payments visible.
3. Try to add a second "Joseph Thorne" under the same instructor → blocked with a friendly message.
