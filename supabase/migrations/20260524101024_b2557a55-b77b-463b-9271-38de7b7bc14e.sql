CREATE POLICY "Pupils can read own milestones"
ON public.pupil_milestones
FOR SELECT
TO authenticated
USING (
  pupil_id IN (
    SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()
  )
);