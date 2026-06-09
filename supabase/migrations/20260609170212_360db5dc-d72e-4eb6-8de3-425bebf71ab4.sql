-- NEW-C5: Lock down pupil_certificates anon read
DROP POLICY IF EXISTS "Anon can view certificates for pupil portal" ON public.pupil_certificates;

CREATE POLICY "Pupils can view own certificates"
ON public.pupil_certificates FOR SELECT TO authenticated
USING (
  pupil_id IN (
    SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()
  )
);

-- C3 + M2: parent_pupil_links join table
CREATE TABLE public.parent_pupil_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pupil_id uuid NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_auth_user_id, pupil_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_pupil_links TO authenticated;
GRANT ALL ON public.parent_pupil_links TO service_role;

ALTER TABLE public.parent_pupil_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents view own links"
ON public.parent_pupil_links FOR SELECT TO authenticated
USING (parent_auth_user_id = auth.uid());

CREATE INDEX idx_parent_pupil_links_parent ON public.parent_pupil_links(parent_auth_user_id);
CREATE INDEX idx_parent_pupil_links_pupil ON public.parent_pupil_links(pupil_id);

-- Backfill from existing parent_email matches
INSERT INTO public.parent_pupil_links (parent_auth_user_id, pupil_id)
SELECT au.id, p.id
FROM public.pupils p
JOIN auth.users au ON lower(au.email) = lower(p.parent_email)
WHERE p.parent_email IS NOT NULL AND p.parent_email <> ''
ON CONFLICT DO NOTHING;

-- Security definer helper for RLS
CREATE OR REPLACE FUNCTION public.has_parent_access(p_pupil_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parent_pupil_links
    WHERE parent_auth_user_id = auth.uid()
      AND pupil_id = p_pupil_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_parent_access(uuid) TO authenticated;

-- RLS policies for parent read access on existing tables
CREATE POLICY "Parents view linked pupils"
ON public.pupils FOR SELECT TO authenticated
USING (public.has_parent_access(id));

CREATE POLICY "Parents view linked lessons"
ON public.scheduled_lessons FOR SELECT TO authenticated
USING (public.has_parent_access(pupil_id));

CREATE POLICY "Parents view linked payment history"
ON public.payment_history FOR SELECT TO authenticated
USING (public.has_parent_access(pupil_id));