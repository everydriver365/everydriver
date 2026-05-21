
-- Recovery codes for MFA — stores bcrypt hashes only
CREATE TABLE public.instructor_mfa_recovery_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_instructor_mfa_recovery_codes_instructor
  ON public.instructor_mfa_recovery_codes(instructor_id)
  WHERE used_at IS NULL;

ALTER TABLE public.instructor_mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

-- Instructors can view metadata of their own codes (the code_hash column is
-- present but treated as opaque server-side — clients must not select it).
CREATE POLICY "Instructor can read own recovery code metadata"
ON public.instructor_mfa_recovery_codes
FOR SELECT
TO authenticated
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- No client-side insert / update / delete. Service role bypasses RLS and
-- handles all writes via edge functions.
