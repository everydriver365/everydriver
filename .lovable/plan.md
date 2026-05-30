## Problem

Archiving works (the RPC writes `deleted_at`), but the Archived Pupils dialog comes up empty.

Reason: the only SELECT policy on `public.pupils` for instructors is:

```
((instructor_id = get_instructor_id_for_user(auth.uid())) AND (deleted_at IS NULL))
```

So archived rows (deleted_at IS NOT NULL) are invisible to instructors. Only admins can see them today.

## Fix

Add an additional SELECT policy on `public.pupils` so instructors can read their own archived rows:

```sql
CREATE POLICY "Instructors view own archived pupils"
ON public.pupils
FOR SELECT
TO authenticated
USING (
  instructor_id = public.get_instructor_id_for_user(auth.uid())
  AND deleted_at IS NOT NULL
);
```

That's it — one migration, no code changes. The existing dialog query (`.not("deleted_at", "is", null)`) and the archived-count query on the pupils page will both start returning Suzanna and any other archived pupils.

No data is deleted; archived rows remain in the table and can still be restored via the existing `restore_pupil` RPC.
