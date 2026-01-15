-- Fix instructor deletion by updating foreign keys that currently block deletes
-- 1) Pupils should be removed when an instructor is deleted
ALTER TABLE public.pupils
  DROP CONSTRAINT IF EXISTS pupils_instructor_id_fkey;
ALTER TABLE public.pupils
  ADD CONSTRAINT pupils_instructor_id_fkey
  FOREIGN KEY (instructor_id)
  REFERENCES public.instructors(id)
  ON DELETE CASCADE;

-- 2) Lesson history should be removed when an instructor is deleted
ALTER TABLE public.lesson_history
  DROP CONSTRAINT IF EXISTS lesson_history_instructor_id_fkey;
ALTER TABLE public.lesson_history
  ADD CONSTRAINT lesson_history_instructor_id_fkey
  FOREIGN KEY (instructor_id)
  REFERENCES public.instructors(id)
  ON DELETE CASCADE;

-- 3) Course enquiries should keep the enquiry but unassign the instructor
ALTER TABLE public.course_enquiries
  DROP CONSTRAINT IF EXISTS course_enquiries_assigned_instructor_id_fkey;
ALTER TABLE public.course_enquiries
  ADD CONSTRAINT course_enquiries_assigned_instructor_id_fkey
  FOREIGN KEY (assigned_instructor_id)
  REFERENCES public.instructors(id)
  ON DELETE SET NULL;