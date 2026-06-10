ALTER TABLE public.schools
  DROP COLUMN IF EXISTS own_stripe_secret_key,
  DROP COLUMN IF EXISTS own_square_access_token,
  DROP COLUMN IF EXISTS own_paypal_secret;