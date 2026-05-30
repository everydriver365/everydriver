# Fix archive RLS + guarantee no hard deletes

## What's happening

`ArchivePupilDialog` does a direct `supabase.from("pupils").update({ deleted_at, archive_reason, archive_note })`. The `pupils` table has two competing UPDATE policies:

- `Instructors update own pupils` — requires `instructor_id = get_instructor_id_for_user(auth.uid())`
- `Pupils can update their own row` — requires `auth_user_id = auth.uid()`

If the logged-in account isn't perfectly resolved to the pupil's owning instructor (e.g. a school owner, an admin not yet seeded into `user_roles`, or an instructor whose `auth_user_id` link is stale), the `WITH CHECK` fails and Postgres returns `new row violates row-level security policy for table "pupils"`. The current pupil `Susanna Wright` belongs to instructor `Ken D` (`auth_user_id 023c4e27…`). Any other signed-in user trips the policy.

Also the user wants a guarantee that pupil records are never hard-deleted.

## Plan

### 1. New SECURITY DEFINER RPC `public.archive_pupil`

Replaces the direct UPDATE from the client. Centralises the authorisation check and bypasses the dual-policy edge case.

```sql
create or replace function public.archive_pupil(
  p_pupil_id uuid,
  p_reason   text,
  p_note     text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_instructor uuid;
  v_pupil_instructor  uuid;
begin
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'Archive reason is required';
  end if;

  select instructor_id into v_pupil_instructor
  from public.pupils where id = p_pupil_id;

  if v_pupil_instructor is null then
    raise exception 'Pupil not found';
  end if;

  v_caller_instructor := public.get_instructor_id_for_user(auth.uid());

  if not (
       v_caller_instructor = v_pupil_instructor
       or public.has_role(auth.uid(), 'admin'::app_role)
     ) then
    raise exception 'Not authorised to archive this pupil';
  end if;

  update public.pupils
     set deleted_at     = coalesce(deleted_at, now()),
         archive_reason = p_reason,
         archive_note   = nullif(trim(coalesce(p_note,'')), '')
   where id = p_pupil_id;
end;
$$;

grant execute on function public.archive_pupil(uuid, text, text) to authenticated;
```

A matching `public.restore_pupil(p_pupil_id uuid)` RPC will clear `deleted_at`, `archive_reason`, `archive_note` with the same authorisation check, so the Archived list's restore button is RLS-safe too.

### 2. Lock down hard deletes on `pupils`

Drop the `Instructors delete own pupils` policy and revoke DELETE so the table can only be soft-archived through the RPC. Admins keep access via `service_role` if ever needed.

```sql
drop policy if exists "Instructors delete own pupils" on public.pupils;
revoke delete on public.pupils from authenticated, anon;
```

(`service_role` retains DELETE for emergency admin tooling; no UI path triggers it.)

### 3. Frontend wiring

- `src/components/instructor/pupils/ArchivePupilDialog.tsx` — replace the `.from("pupils").update(...)` call with `supabase.rpc("archive_pupil", { p_pupil_id, p_reason, p_note })`.
- `src/components/instructor/pupils/ArchivedPupilsDialog.tsx` — replace the restore UPDATE with `supabase.rpc("restore_pupil", { p_pupil_id })`.

No other UI changes; the dialog UX, preset reasons, and note field stay identical.

## Result

- Archive succeeds for any legitimate owner (instructor of record) or admin, regardless of which of the two UPDATE policies would otherwise match.
- Records are soft-archived only — `deleted_at`, `archive_reason`, `archive_note` are stamped; no row is ever removed from `pupils`. Hard delete is no longer reachable from the client.
- Restore path is symmetric and RLS-safe.
