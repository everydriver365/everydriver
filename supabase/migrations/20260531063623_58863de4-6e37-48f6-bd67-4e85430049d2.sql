
-- Square Invoices table for instructor and platform/school invoicing
CREATE TABLE public.square_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_type TEXT NOT NULL CHECK (issuer_type IN ('instructor', 'school')),
  issuer_instructor_id UUID REFERENCES public.instructors(id) ON DELETE SET NULL,
  recipient_pupil_id UUID REFERENCES public.pupils(id) ON DELETE SET NULL,
  recipient_email TEXT,
  recipient_name TEXT,
  square_invoice_id TEXT UNIQUE,
  square_order_id TEXT,
  public_url TEXT,
  square_location_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  amount_cents INTEGER NOT NULL DEFAULT 0,
  service_fee_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  due_date DATE,
  description TEXT,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  last_event_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_square_invoices_instructor ON public.square_invoices(issuer_instructor_id);
CREATE INDEX idx_square_invoices_pupil ON public.square_invoices(recipient_pupil_id);
CREATE INDEX idx_square_invoices_status ON public.square_invoices(status);
CREATE INDEX idx_square_invoices_square_id ON public.square_invoices(square_invoice_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.square_invoices TO authenticated;
GRANT ALL ON public.square_invoices TO service_role;

ALTER TABLE public.square_invoices ENABLE ROW LEVEL SECURITY;

-- Instructor can view/manage their own issued invoices
CREATE POLICY "Instructors view own invoices"
ON public.square_invoices FOR SELECT TO authenticated
USING (
  issuer_instructor_id = public.get_instructor_id_for_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR recipient_pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Instructors insert own invoices"
ON public.square_invoices FOR INSERT TO authenticated
WITH CHECK (
  (issuer_type = 'instructor' AND issuer_instructor_id = public.get_instructor_id_for_user(auth.uid()))
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Instructors update own invoices"
ON public.square_invoices FOR UPDATE TO authenticated
USING (
  issuer_instructor_id = public.get_instructor_id_for_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins delete invoices"
ON public.square_invoices FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_square_invoices_updated_at
BEFORE UPDATE ON public.square_invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Instructor preference: default invoice due days
ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS default_invoice_due_days INTEGER NOT NULL DEFAULT 7;
