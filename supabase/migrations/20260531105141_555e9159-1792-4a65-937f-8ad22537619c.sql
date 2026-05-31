
ALTER TABLE public.square_invoices
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

CREATE INDEX IF NOT EXISTS idx_square_invoices_instructor_active
  ON public.square_invoices (issuer_instructor_id)
  WHERE deleted_at IS NULL;
