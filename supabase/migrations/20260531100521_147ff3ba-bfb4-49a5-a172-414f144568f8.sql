ALTER TABLE public.square_invoices
  ADD COLUMN IF NOT EXISTS klarna_last_error text,
  ADD COLUMN IF NOT EXISTS klarna_last_error_at timestamptz;