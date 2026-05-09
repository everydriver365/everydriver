## Why it's failing

The `instructor_courses` table has only two RLS policies:
- public read
- admins can do everything

There's no policy that lets an **instructor** insert/update/delete their own row, so when Richard (or any instructor) hits "Add", Supabase returns `42501 — new row violates row-level security policy`. That's the "Failed to add course" toast.

## What to change

### 1. Database (migration)

Add three RLS policies on `public.instructor_courses` so instructors can manage only their own rows, using the standard identity helper:

- **Insert** — `WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()))`
- **Update** — `USING / WITH CHECK` same condition
- **Delete** — `USING` same condition

Public read and admin-manage policies stay as they are.

### 2. Replace `InstructorCoursesManager.tsx` with a simple toggle list

Current UI: a "Add a course…" dropdown + cards with edit/delete/image upload. Too many steps and the failing path.

New UI: one row per **course template** from `course_templates` (currently 5: 10h Automatic, 20h, Test in a Week 28h, 30h, 40h). Each row shows:

- Template name + hours badge
- A single Switch on the right

Toggle behaviour:

- **Off → On**: if no `instructor_courses` row exists, insert one (`is_active = true`, copy `course_name` and `default_image_url` from the template). If a row exists but is inactive, update `is_active = true`.
- **On → Off**: update the existing row to `is_active = false` (keep the row so any custom price/features survive).

Optimistic update + revert on error. Toast on success/failure.

Remove from this component: the Add dropdown, the Edit dialog, image upload, custom features editor, delete button. Pricing/customisation can live in a future "advanced" screen — out of scope for this task.

### 3. Verify

- Sign in as Richard Chapman, open Menu → Courses & payments → My Courses, toggle a course on, confirm a row appears in `instructor_courses` and no RLS error.
- Confirm Richard now appears in the pupil-facing course/postcode search (the original symptom that started this thread).

## Files touched

- New migration: 3 RLS policies on `instructor_courses`.
- `src/components/instructor/InstructorCoursesManager.tsx` — rewritten as a toggle list.

No changes to the menu entry, routing, or pupil-facing search code.
