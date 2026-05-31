ALTER TABLE public.square_invoices
  ADD COLUMN IF NOT EXISTS klarna_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS klarna_pay_url text,
  ADD COLUMN IF NOT EXISTS klarna_order_id text;