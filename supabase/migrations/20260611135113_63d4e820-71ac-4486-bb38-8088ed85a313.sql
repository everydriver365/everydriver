
-- 1. Instructor sub-account columns
ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS ryft_account_id text,
  ADD COLUMN IF NOT EXISTS ryft_account_status text,
  ADD COLUMN IF NOT EXISTS ryft_onboarding_url text,
  ADD COLUMN IF NOT EXISTS ryft_payouts_enabled boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_instructors_ryft_account_id ON public.instructors(ryft_account_id);

-- 2. ryft_payment_intents
CREATE TABLE IF NOT EXISTS public.ryft_payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ryft_payment_session_id text UNIQUE NOT NULL,
  instructor_id uuid NOT NULL,
  pupil_id uuid,
  amount_pence integer NOT NULL,
  service_fee_pence integer NOT NULL DEFAULT 0,
  platform_fee_pence integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GBP',
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  checkout_url text,
  last_error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ryft_payment_intents TO authenticated;
GRANT ALL ON public.ryft_payment_intents TO service_role;

ALTER TABLE public.ryft_payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own ryft intents"
  ON public.ryft_payment_intents FOR SELECT
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Admins view all ryft intents"
  ON public.ryft_payment_intents FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_ryft_intents_instructor ON public.ryft_payment_intents(instructor_id);
CREATE INDEX IF NOT EXISTS idx_ryft_intents_pupil ON public.ryft_payment_intents(pupil_id);
CREATE INDEX IF NOT EXISTS idx_ryft_intents_status ON public.ryft_payment_intents(status);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_ryft_intents_updated_at ON public.ryft_payment_intents;
CREATE TRIGGER trg_ryft_intents_updated_at
  BEFORE UPDATE ON public.ryft_payment_intents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. ryft_webhook_events
CREATE TABLE IF NOT EXISTS public.ryft_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  signature_valid boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.ryft_webhook_events TO service_role;

ALTER TABLE public.ryft_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view ryft webhook events"
  ON public.ryft_webhook_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_ryft_webhook_event_type ON public.ryft_webhook_events(event_type);
