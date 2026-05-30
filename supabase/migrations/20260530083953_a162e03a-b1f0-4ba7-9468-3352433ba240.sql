CREATE POLICY "Instructors view own archived pupils"
ON public.pupils
FOR SELECT
TO authenticated
USING (
  instructor_id = public.get_instructor_id_for_user(auth.uid())
  AND deleted_at IS NOT NULL
);