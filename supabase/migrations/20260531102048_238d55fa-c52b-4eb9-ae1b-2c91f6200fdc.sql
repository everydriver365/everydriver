ALTER TABLE public.square_invoices
  ADD COLUMN IF NOT EXISTS clearpay_enabled boolean NOT NULL DEFAULT false;