
CREATE TABLE public.ryft_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issuer_type TEXT NOT NULL DEFAULT 'instructor',
  issuer_instructor_id UUID REFERENCES public.instructors(id) ON DELETE SET NULL,
  recipient_pupil_id UUID REFERENCES public.pupils(id) ON DELETE SET NULL,
  recipient_email TEXT,
  recipient_name TEXT,
  ryft_payment_session_id TEXT,
  ryft_payment_link_url TEXT,
  public_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  amount_pence INTEGER NOT NULL,
  service_fee_pence INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  due_date DATE,
  description TEXT,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  accepted_payment_methods JSONB NOT NULL DEFAULT '["card"]'::jsonb,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  last_event_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refund_amount_pence INTEGER,
  last_error TEXT,
  created_by UUID,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ryft_invoices TO authenticated;
GRANT ALL ON public.ryft_invoices TO service_role;

ALTER TABLE public.ryft_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage their own ryft invoices"
ON public.ryft_invoices
FOR ALL
TO authenticated
USING (issuer_instructor_id = public.get_instructor_id_for_user(auth.uid()))
WITH CHECK (issuer_instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Pupils view their own ryft invoices"
ON public.ryft_invoices
FOR SELECT
TO authenticated
USING (recipient_pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()));

CREATE INDEX idx_ryft_invoices_instructor ON public.ryft_invoices(issuer_instructor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_ryft_invoices_pupil ON public.ryft_invoices(recipient_pupil_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_ryft_invoices_session ON public.ryft_invoices(ryft_payment_session_id);

CREATE TRIGGER update_ryft_invoices_updated_at
BEFORE UPDATE ON public.ryft_invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TABLE IF EXISTS public.square_invoices CASCADE;
DROP TABLE IF EXISTS public.processed_square_events CASCADE;

ALTER TABLE public.instructors
  DROP COLUMN IF EXISTS square_access_token_encrypted,
  DROP COLUMN IF EXISTS square_refresh_token_encrypted,
  DROP COLUMN IF EXISTS square_merchant_id,
  DROP COLUMN IF EXISTS square_connected_at,
  DROP COLUMN IF EXISTS square_token_expires_at;
