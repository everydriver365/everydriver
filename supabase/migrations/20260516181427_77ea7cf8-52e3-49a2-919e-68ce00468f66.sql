
-- 1. Verifications table
CREATE TABLE IF NOT EXISTS public.instructor_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  credential_type text NOT NULL CHECK (credential_type IN ('adi_grade','dbs_check','public_liability','vehicle_insurance','first_aid','pass_plus','fleet')),
  value text,
  document_url text,
  expires_at date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected','expired')),
  admin_notes text,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instructor_id, credential_type)
);

CREATE INDEX IF NOT EXISTS idx_instructor_verifications_instructor ON public.instructor_verifications(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_verifications_status ON public.instructor_verifications(status);

ALTER TABLE public.instructor_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own verifications"
  ON public.instructor_verifications FOR SELECT
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors insert own verifications"
  ON public.instructor_verifications FOR INSERT
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors update own pending verifications"
  ON public.instructor_verifications FOR UPDATE
  USING (
    instructor_id = public.get_instructor_id_for_user(auth.uid())
    AND status IN ('pending','rejected','expired')
  );

CREATE POLICY "Admins view all verifications"
  ON public.instructor_verifications FOR SELECT
  USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins update all verifications"
  ON public.instructor_verifications FOR UPDATE
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_instructor_verifications_updated_at
  BEFORE UPDATE ON public.instructor_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Founding instructor flag + badge toggle on instructors
ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS is_founding_instructor boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_pro_badge_enabled boolean NOT NULL DEFAULT true;

-- Backfill founding badge for all existing instructors created up to now
UPDATE public.instructors
  SET is_founding_instructor = true
  WHERE created_at <= now() AND is_founding_instructor = false;

-- 3. Public summary function (used on mini-websites — no auth required)
CREATE OR REPLACE FUNCTION public.get_verified_pro_summary(p_instructor_id uuid)
RETURNS TABLE (
  instructor_id uuid,
  badge_enabled boolean,
  is_founding boolean,
  verified_credential_count integer,
  verified_types text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id,
    COALESCE(i.verified_pro_badge_enabled, true),
    COALESCE(i.is_founding_instructor, false),
    COALESCE((
      SELECT COUNT(*)::int FROM public.instructor_verifications v
      WHERE v.instructor_id = i.id AND v.status = 'verified'
        AND (v.expires_at IS NULL OR v.expires_at > current_date)
    ), 0),
    COALESCE((
      SELECT ARRAY_AGG(v.credential_type ORDER BY v.credential_type)
      FROM public.instructor_verifications v
      WHERE v.instructor_id = i.id AND v.status = 'verified'
        AND (v.expires_at IS NULL OR v.expires_at > current_date)
    ), ARRAY[]::text[])
  FROM public.instructors i
  WHERE i.id = p_instructor_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_verified_pro_summary(uuid) TO anon, authenticated;

-- 4. Storage bucket for credential documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('instructor-credentials','instructor-credentials', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Instructors upload own credential docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'instructor-credentials'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Instructors read own credential docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'instructor-credentials'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Instructors update own credential docs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'instructor-credentials'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Instructors delete own credential docs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'instructor-credentials'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins read all credential docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'instructor-credentials'
    AND public.has_role(auth.uid(),'admin')
  );
