
-- Add payment gateway columns to schools table
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS payment_gateway_mode text NOT NULL DEFAULT 'platform',
  ADD COLUMN IF NOT EXISTS own_square_app_id text,
  ADD COLUMN IF NOT EXISTS own_square_access_token text,
  ADD COLUMN IF NOT EXISTS own_square_location_id text,
  ADD COLUMN IF NOT EXISTS own_stripe_publishable_key text,
  ADD COLUMN IF NOT EXISTS own_stripe_secret_key text,
  ADD COLUMN IF NOT EXISTS own_paypal_client_id text,
  ADD COLUMN IF NOT EXISTS own_paypal_secret text;

-- Seed school_payment commission config row
INSERT INTO public.platform_commission_config (commission_type, rate_percent, fixed_fee_pence, is_active)
VALUES ('school_payment', 3.5, 20, true)
ON CONFLICT DO NOTHING;
