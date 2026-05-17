
ALTER TABLE public.pupils
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pupils_auth_user_id ON public.pupils(auth_user_id);

DROP POLICY IF EXISTS "Pupils can view their own row" ON public.pupils;
CREATE POLICY "Pupils can view their own row"
  ON public.pupils
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Pupils can update their own row" ON public.pupils;
CREATE POLICY "Pupils can update their own row"
  ON public.pupils
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());
