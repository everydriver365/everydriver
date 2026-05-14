ALTER TABLE public.payment_history
  ADD COLUMN IF NOT EXISTS external_payment_ref text;

CREATE UNIQUE INDEX IF NOT EXISTS payment_history_external_payment_ref_uq
  ON public.payment_history (external_payment_ref)
  WHERE external_payment_ref IS NOT NULL;