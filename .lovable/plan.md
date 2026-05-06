# Fix: Phone tracking on instructor mobile app

## Root cause

Phone tracking permission writes are **silently failing with HTTP 400**:

```
POST /rest/v1/phone_tracking_permissions?on_conflict=instructor_id,pupil_id
=> 42P10 "there is no unique or exclusion constraint matching the
   ON CONFLICT specification"
```

The DB has a **partial/expression unique index** on
`(instructor_id, COALESCE(pupil_id, '00000000-...'))`, not a plain
`(instructor_id, pupil_id)` constraint. PostgREST's `onConflict` parameter
can't target expression indexes, so every upsert from
`src/hooks/useLocationPermission.ts` is rejected. As a result:

- Granted permission is never persisted
- Tracking can't resume on next visit
- The "Phone GPS is ready" state never sticks → tracking effectively never works

## Fix

Replace the failing `.upsert(..., { onConflict: "instructor_id,pupil_id" })`
in `src/hooks/useLocationPermission.ts` with a manual lookup-then-insert/update
that works with the existing partial index:

```ts
// Look up existing row keyed on (instructor_id, pupil_id-or-null)
let q = supabase
  .from("phone_tracking_permissions")
  .select("id")
  .eq("instructor_id", instructorId);
q = pupilId ? q.eq("pupil_id", pupilId) : q.is("pupil_id", null);
const { data: existing } = await q.maybeSingle();

if (existing?.id) {
  await supabase
    .from("phone_tracking_permissions")
    .update(row).eq("id", existing.id);
} else {
  await supabase.from("phone_tracking_permissions").insert([row]);
}
```

No schema migration required — the existing partial unique index already
prevents duplicate rows. No other call sites use this table for writes.

## Files

- `src/hooks/useLocationPermission.ts` — replace the upsert block in `persist()`

## Verification

After the fix:
- `POST /phone_tracking_permissions` should return 201/204 instead of 400
- Re-opening `/instructor/tracking` should show the previously granted state
  without re-prompting
