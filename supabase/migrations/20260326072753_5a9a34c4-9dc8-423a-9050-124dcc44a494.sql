
ALTER TABLE public.instructors 
  ADD COLUMN IF NOT EXISTS square_merchant_id text,
  ADD COLUMN IF NOT EXISTS square_access_token_encrypted text,
  ADD COLUMN IF NOT EXISTS square_refresh_token_encrypted text,
  ADD COLUMN IF NOT EXISTS square_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS square_connected_at timestamptz;
