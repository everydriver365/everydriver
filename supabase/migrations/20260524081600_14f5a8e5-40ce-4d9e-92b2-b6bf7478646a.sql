CREATE POLICY "pupils_read_own_syllabus_progress"
ON public.pupil_syllabus_progress
FOR SELECT
TO authenticated
USING (
  pupil_id IN (
    SELECT id FROM public.pupils
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "pupils_read_own_lesson_syllabus_updates"
ON public.lesson_syllabus_updates
FOR SELECT
TO authenticated
USING (
  pupil_id IN (
    SELECT id FROM public.pupils
    WHERE auth_user_id = auth.uid()
  )
);