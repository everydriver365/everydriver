CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.auth_rate_limits TO service_role;

CREATE INDEX IF NOT EXISTS auth_rate_limits_key_created_idx
  ON public.auth_rate_limits(key, created_at);

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.pupil_otp_codes
  ADD COLUMN IF NOT EXISTS identifier text;

UPDATE public.pupil_otp_codes
  SET identifier = phone
  WHERE identifier IS NULL;