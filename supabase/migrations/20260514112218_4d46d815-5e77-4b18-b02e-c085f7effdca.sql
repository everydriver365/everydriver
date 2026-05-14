-- Safe visitor-facing availability views for public course and booking pages
-- These expose only the minimal fields needed to prevent false availability,
-- without exposing pupil details, lesson notes, or manual block titles/notes.

CREATE OR REPLACE VIEW public.public_scheduled_lesson_blocks
WITH (security_invoker = false) AS
SELECT
  instructor_id,
  lesson_date,
  start_time,
  duration_minutes
FROM public.scheduled_lessons
WHERE deleted_at IS NULL
  AND status <> 'cancelled';

CREATE OR REPLACE VIEW public.public_instructor_manual_blocks
WITH (security_invoker = false) AS
SELECT
  instructor_id,
  start_datetime,
  end_datetime
FROM public.instructor_manual_blocks;

CREATE OR REPLACE VIEW public.public_instructor_booking_preferences
WITH (security_invoker = false) AS
SELECT
  id,
  COALESCE(prefer_earliest_slot, false) AS prefer_earliest_slot
FROM public.instructors
WHERE is_active = true;

CREATE OR REPLACE VIEW public.public_instructor_presence
WITH (security_invoker = false) AS
SELECT
  id,
  last_active_at
FROM public.instructors
WHERE is_active = true;

GRANT SELECT ON public.public_scheduled_lesson_blocks TO anon, authenticated;
GRANT SELECT ON public.public_instructor_manual_blocks TO anon, authenticated;
GRANT SELECT ON public.public_instructor_booking_preferences TO anon, authenticated;
GRANT SELECT ON public.public_instructor_presence TO anon, authenticated;

-- Avoid policy subqueries against the protected instructors table for anonymous visitors.
DROP POLICY IF EXISTS "Instructors view own scheduled lessons" ON public.scheduled_lessons;
DROP POLICY IF EXISTS "Instructors can view their own scheduled lessons" ON public.scheduled_lessons;
CREATE POLICY "Instructors view own scheduled lessons"
ON public.scheduled_lessons
FOR SELECT
TO authenticated
USING (
  instructor_id = public.get_instructor_id_for_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Instructors can view their own blocks" ON public.instructor_manual_blocks;
CREATE POLICY "Instructors can view their own blocks"
ON public.instructor_manual_blocks
FOR SELECT
TO authenticated
USING (
  instructor_id = public.get_instructor_id_for_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);