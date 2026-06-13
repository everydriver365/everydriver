CREATE POLICY "Pupils view own lesson history"
ON public.lesson_history
FOR SELECT
TO authenticated
USING (
  pupil_id IN (
    SELECT pupils.id
    FROM public.pupils
    WHERE pupils.auth_user_id = auth.uid()
      AND pupils.deleted_at IS NULL
  )
);