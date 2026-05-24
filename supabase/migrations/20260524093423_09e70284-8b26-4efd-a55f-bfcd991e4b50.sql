-- 2. Create parents table
CREATE TABLE IF NOT EXISTS public.parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL,
  name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS parents_phone_idx ON public.parents(phone);
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parents_read_own" ON public.parents
  FOR SELECT USING (auth_user_id = auth.uid());
CREATE POLICY "parents_update_own" ON public.parents
  FOR UPDATE USING (auth_user_id = auth.uid());

-- 3. Link parents to pupils
ALTER TABLE public.pupils ADD COLUMN IF NOT EXISTS parent_user_id uuid REFERENCES public.parents(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS pupils_parent_user_id_idx ON public.pupils(parent_user_id);

-- 4. Parent RLS on pupil_syllabus_progress
CREATE POLICY "parents_read_pupil_syllabus"
ON public.pupil_syllabus_progress FOR SELECT
USING (
  pupil_id IN (
    SELECT id FROM public.pupils
    WHERE parent_user_id IN (
      SELECT id FROM public.parents WHERE auth_user_id = auth.uid()
    )
  )
);

-- 5. Same for lesson_syllabus_updates
CREATE POLICY "parents_read_lesson_syllabus_updates"
ON public.lesson_syllabus_updates FOR SELECT
USING (
  pupil_id IN (
    SELECT id FROM public.pupils
    WHERE parent_user_id IN (
      SELECT id FROM public.parents WHERE auth_user_id = auth.uid()
    )
  )
);