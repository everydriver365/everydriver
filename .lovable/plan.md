## Problem

Every manual lesson booking fails with the toast **"Couldn't add lesson to your Google Calendar — the slot has been released."**

The `sync-lesson-now` edge function returns:

```
403 { "error": "Forbidden: caller is not an instructor" }
```

…even though the booking instructor clearly is an instructor (they're logged into `/instructor`).

`syncLessonsOrRollback` then deletes the freshly inserted `scheduled_lessons` row, which is what produces the "slot has been released" message.

## Root cause

`sync-lesson-now/index.ts` calls the RPC with the wrong argument name:

```ts
await supabase.rpc("get_instructor_id_for_user", { _user_id: userId });
```

The actual function signature in the database is:

```
get_instructor_id_for_user(p_user_id uuid) -> uuid
```

Because `_user_id` doesn't match `p_user_id`, Postgres receives `p_user_id = NULL`, the RPC returns `NULL`, and the guard fires the 403. The sister function `record-payment/index.ts` already uses the correct `{ p_user_id: userId }`.

## Fix

One-line change in `supabase/functions/sync-lesson-now/index.ts` (line 63):

```diff
- const { data: instructorRow } = await supabase.rpc("get_instructor_id_for_user", {
-   _user_id: userId,
- });
+ const { data: instructorRow } = await supabase.rpc("get_instructor_id_for_user", {
+   p_user_id: userId,
+ });
```

No DB migration, no client changes, no other files affected.

## Verification

1. Redeploy (automatic on edit).
2. From `/instructor`, open Add Lesson → pick pupil/date/time → Book.
3. Expect: lesson appears in the schedule, no error toast, and the corresponding event shows up on the connected Google Calendar.
4. Sanity check the edge function logs — should return `200 { ok: true, eventId: "..." }`.

## Out of scope

- No changes to availability logic, Google Calendar service-account setup, or rollback behaviour.
- Mobile layouts untouched.
