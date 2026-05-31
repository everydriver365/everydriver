ALTER TABLE public.square_invoices
  ADD COLUMN IF NOT EXISTS klarna_status text;

CREATE INDEX IF NOT EXISTS idx_square_invoices_klarna_order_id
  ON public.square_invoices (klarna_order_id)
  WHERE klarna_order_id IS NOT NULL;