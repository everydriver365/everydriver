
-- MTD quarterly obligation periods
CREATE TABLE public.mtd_quarterly_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  deadline DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'submitted', 'accepted', 'error')),
  total_income NUMERIC DEFAULT 0,
  total_expenses NUMERIC DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  hmrc_submission_id TEXT,
  hmrc_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, tax_year, quarter)
);

-- SA103 expense category mappings for HMRC self-employment
CREATE TABLE public.mtd_sa103_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_category TEXT NOT NULL,
  sa103_box TEXT NOT NULL,
  sa103_label TEXT NOT NULL,
  hmrc_category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HMRC submission log with full audit trail
CREATE TABLE public.mtd_submission_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  period_id UUID REFERENCES public.mtd_quarterly_periods(id),
  submission_type TEXT NOT NULL CHECK (submission_type IN ('quarterly_update', 'eops', 'final_declaration')),
  tax_year INTEGER NOT NULL,
  quarter INTEGER,
  payload JSONB NOT NULL,
  hmrc_correlation_id TEXT,
  hmrc_response JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'accepted', 'rejected', 'error')),
  error_message TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Instructor MTD settings
CREATE TABLE public.mtd_instructor_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE UNIQUE,
  is_mtd_enrolled BOOLEAN DEFAULT false,
  hmrc_nino TEXT,
  utr TEXT,
  business_name TEXT,
  business_start_date DATE,
  accounting_type TEXT DEFAULT 'cash' CHECK (accounting_type IN ('cash', 'accruals')),
  flat_rate_expenses BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mtd_quarterly_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mtd_sa103_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mtd_submission_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mtd_instructor_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for quarterly periods
CREATE POLICY "Instructors view own quarterly periods" ON public.mtd_quarterly_periods
  FOR SELECT TO authenticated
  USING (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));
CREATE POLICY "Instructors manage own quarterly periods" ON public.mtd_quarterly_periods
  FOR ALL TO authenticated
  USING (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

-- SA103 mappings are read-only reference data
CREATE POLICY "Anyone can read SA103 mappings" ON public.mtd_sa103_mappings
  FOR SELECT TO authenticated USING (true);

-- RLS for submission log
CREATE POLICY "Instructors view own submissions" ON public.mtd_submission_log
  FOR SELECT TO authenticated
  USING (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));
CREATE POLICY "Instructors manage own submissions" ON public.mtd_submission_log
  FOR ALL TO authenticated
  USING (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

-- RLS for MTD settings
CREATE POLICY "Instructors view own MTD settings" ON public.mtd_instructor_settings
  FOR SELECT TO authenticated
  USING (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));
CREATE POLICY "Instructors manage own MTD settings" ON public.mtd_instructor_settings
  FOR ALL TO authenticated
  USING (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

-- Seed SA103 mappings for driving instructor categories
INSERT INTO public.mtd_sa103_mappings (expense_category, sa103_box, sa103_label, hmrc_category, description) VALUES
  ('Fuel', '20', 'Car, van and travel expenses', 'car_van_travel', 'Fuel costs for business use of vehicle'),
  ('Vehicle Maintenance', '20', 'Car, van and travel expenses', 'car_van_travel', 'Vehicle repairs, servicing, MOT'),
  ('Tolls & Parking', '20', 'Car, van and travel expenses', 'car_van_travel', 'Parking fees, tolls, congestion charges'),
  ('Insurance', '21', 'Other allowable business expenses', 'other_expenses', 'Business vehicle insurance'),
  ('Training Materials', '17', 'Staff costs', 'staff_costs', 'Teaching aids, textbooks, training resources'),
  ('Office Supplies', '19', 'Administrative costs', 'admin_costs', 'Phone, stationery, software subscriptions'),
  ('Marketing', '18', 'Advertising and marketing', 'advertising', 'Website, signage, online advertising'),
  ('Other', '21', 'Other allowable business expenses', 'other_expenses', 'Miscellaneous business expenses');

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_mtd_quarterly BEFORE UPDATE ON public.mtd_quarterly_periods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_mtd_settings BEFORE UPDATE ON public.mtd_instructor_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
