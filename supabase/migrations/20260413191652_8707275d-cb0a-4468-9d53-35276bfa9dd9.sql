
CREATE TABLE public.school_franchise_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_paid',
  payment_method TEXT,
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.school_franchise_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage franchise fees"
  ON public.school_franchise_fees FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "School owners view franchise fees"
  ON public.school_franchise_fees FOR SELECT TO authenticated
  USING (public.is_school_owner(school_id));

CREATE TRIGGER update_school_franchise_fees_updated_at
  BEFORE UPDATE ON public.school_franchise_fees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS franchise_fee_amount NUMERIC DEFAULT 0;
