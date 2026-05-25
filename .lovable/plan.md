## Fix: Instructor jobs feed showing empty

**Problem:** RLS on `course_enquiries` only lets instructors see rows where `assigned_instructor_id = their id`. Pending/unassigned jobs (the broadcast pool) are therefore invisible, so the jobs feed appears empty.

**Fix:** Add one SELECT policy so any authenticated instructor can read pending, unassigned enquiries. Existing admin and assigned-instructor policies are left untouched.

### Migration

```sql
CREATE POLICY "Instructors can view pending unassigned enquiries"
ON public.course_enquiries
FOR SELECT
TO authenticated
USING (
  assigned_instructor_id IS NULL
  AND status = 'pending'
  AND public.get_instructor_id_for_user(auth.uid()) IS NOT NULL
);
```

### Behaviour after fix
- Instructors see the pool of pending, unclaimed jobs again.
- Once a job is claimed/assigned or moves off `pending`, it disappears from other instructors' feeds automatically.
- Admins and the assigned instructor keep full access via existing policies.
- No code changes; radius/geo filtering stays client-side.
