CREATE POLICY "Instructors can view pending unassigned enquiries"
ON public.course_enquiries
FOR SELECT
TO authenticated
USING (
  assigned_instructor_id IS NULL
  AND status = 'pending'
  AND public.get_instructor_id_for_user(auth.uid()) IS NOT NULL
);