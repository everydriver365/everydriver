
-- Drop previous partial objects
DROP TABLE IF EXISTS public.notes CASCADE;
DROP FUNCTION IF EXISTS public.get_instructor_id_for_user(uuid);

-- Create notes table
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL,
  owner_id uuid NOT NULL,
  shared_with_id uuid,
  title text NOT NULL DEFAULT 'Untitled',
  content text NOT NULL DEFAULT '',
  is_pinned boolean DEFAULT false,
  folder text DEFAULT 'General',
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_owner ON public.notes (owner_type, owner_id, deleted_at);
CREATE INDEX idx_notes_shared ON public.notes (shared_with_id) WHERE shared_with_id IS NOT NULL;

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION public.get_instructor_id_for_user(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.instructors WHERE auth_user_id = p_user_id LIMIT 1
$$;

-- Instructor policies
CREATE POLICY "Instructors can manage own notes"
ON public.notes FOR ALL TO authenticated
USING (owner_type = 'instructor' AND owner_id = public.get_instructor_id_for_user(auth.uid()))
WITH CHECK (owner_type = 'instructor' AND owner_id = public.get_instructor_id_for_user(auth.uid()));

-- Pupil policies (anon - pupils use OTP, no auth user)
CREATE POLICY "Anon can read pupil notes"
ON public.notes FOR SELECT TO anon
USING (owner_type = 'pupil' AND deleted_at IS NULL);

CREATE POLICY "Anon can insert pupil notes"
ON public.notes FOR INSERT TO anon
WITH CHECK (owner_type = 'pupil');

CREATE POLICY "Anon can update pupil notes"
ON public.notes FOR UPDATE TO anon
USING (owner_type = 'pupil') WITH CHECK (owner_type = 'pupil');

CREATE POLICY "Anon can delete pupil notes"
ON public.notes FOR DELETE TO anon
USING (owner_type = 'pupil');

-- Anon can read shared instructor notes (for pupil portal)
CREATE POLICY "Anon can read shared instructor notes"
ON public.notes FOR SELECT TO anon
USING (owner_type = 'instructor' AND shared_with_id IS NOT NULL AND deleted_at IS NULL);

-- Admin policies
CREATE POLICY "Admins can manage admin notes"
ON public.notes FOR ALL TO authenticated
USING (owner_type = 'admin' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (owner_type = 'admin' AND public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER set_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
