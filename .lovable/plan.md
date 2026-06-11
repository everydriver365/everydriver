## Why everything is "spinning" or missing

The Postgres logs show three distinct errors firing continuously — every dashboard tile, pupil card, job list and next-lesson query that touches these paths fails, so the UI either spins forever or renders empty.

```text
1. column scheduled_lessons.end_time does not exist           (hundreds of times/min)
2. column booking_enquiries.assigned_instructor_id does not exist
3. infinite recursion detected in policy for relation "school_instructors"
```

The live `scheduled_lessons` table has `lesson_date`, `start_time`, `duration_minutes` — no `end_time`. The live `booking_enquiries` table uses `instructor_id`, not `assigned_instructor_id`. And the RLS policies on `schools` ↔ `school_instructors` reference each other and loop.

Nothing is wrong with login or the database itself — it's stale code/RLS pointing at columns that no longer exist.

## Plan

### 1. Remove all `scheduled_lessons.end_time` references
Replace `end_time` with `duration_minutes` and compute the end client/server-side from `start_time + duration_minutes` where needed.

Files to fix:
- `src/components/instructor/PupilSplitPane.tsx` (pupil recent-lessons list — this is the exact query in the error log)
- `src/components/instructor/dashboard/DailyManifest.tsx`
- `supabase/functions/get-nearby-instructors/index.ts`
- `supabase/functions/ai-command-center/index.ts` (two queries)
- `supabase/functions/auto-stop-lesson-tracker/index.ts` (two queries; also `order by end_time` → order by `start_time`)

Redeploy each touched edge function.

### 2. Fix `booking_enquiries` column name
- `src/hooks/useNewEnquiriesCount.ts` — change `.eq("assigned_instructor_id", instructorId)` to `.eq("instructor_id", instructorId)` on the `booking_enquiries` query. (The second query in that hook targets `course_enquiries`, which legitimately has `assigned_instructor_id` — leave it.)

This is what's breaking the "new enquiries / job offers" count and silently failing the related dashboard tiles.

### 3. Break the `school_instructors` RLS recursion
The `schools` SELECT policy joins `school_instructors`, and `school_instructors` policies reference `schools` — Postgres detects the loop and aborts.

Migration:
- Create a SECURITY DEFINER helper `public.user_is_school_member(_user uuid, _school uuid) returns boolean` that does the lookup with `SET search_path = public` and bypasses RLS.
- Drop and recreate the offending policies so they call `public.user_is_school_member(auth.uid(), id)` / `school_id` instead of subselecting the other table directly.

### 4. Validate
- Re-run the analytics query for `error_severity = 'ERROR'` and confirm the three errors are gone.
- Reload `/index` on mobile preview and confirm Next Lesson, Pupils, Job Offers and Previous Bookings populate.

### Expected result
Dashboard stops spinning, next-lesson card shows correct lesson, job-offer count and pupil lesson history populate, and the school membership lookups stop erroring.
