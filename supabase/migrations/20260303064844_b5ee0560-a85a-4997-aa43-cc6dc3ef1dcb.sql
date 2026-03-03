
-- =============================================
-- FEATURE 1: Lesson Check-In
-- =============================================

-- Add check_in_status to scheduled_lessons
ALTER TABLE public.scheduled_lessons 
ADD COLUMN IF NOT EXISTS check_in_status TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS check_in_sent_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS check_in_responded_at TIMESTAMPTZ DEFAULT NULL;

-- =============================================
-- FEATURE 2: Photo-Scan Receipts (expense_receipts table)
-- Storage bucket already exists: expense-receipts
-- =============================================

CREATE TABLE IF NOT EXISTS public.expense_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES public.instructor_expenses(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  extracted_amount NUMERIC(10,2),
  extracted_date DATE,
  extracted_category TEXT,
  extracted_vendor TEXT,
  extraction_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view own receipts"
ON public.expense_receipts FOR SELECT
TO authenticated
USING (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

CREATE POLICY "Instructors can insert own receipts"
ON public.expense_receipts FOR INSERT
TO authenticated
WITH CHECK (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

CREATE POLICY "Instructors can update own receipts"
ON public.expense_receipts FOR UPDATE
TO authenticated
USING (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

CREATE POLICY "Instructors can delete own receipts"
ON public.expense_receipts FOR DELETE
TO authenticated
USING (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

CREATE TRIGGER set_expense_receipts_updated_at
BEFORE UPDATE ON public.expense_receipts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- FEATURE 3: Live Waiting List Auto-Confirmation
-- =============================================

ALTER TABLE public.lesson_waitlist
ADD COLUMN IF NOT EXISTS last_confirmed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS auto_expired BOOLEAN DEFAULT false;

-- =============================================
-- FEATURE 4: Digital Terms Agreement
-- =============================================

CREATE TABLE IF NOT EXISTS public.instructor_terms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Terms & Conditions',
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instructor_terms_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own terms"
ON public.instructor_terms_templates FOR ALL
TO authenticated
USING (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

CREATE POLICY "Public can view active terms"
ON public.instructor_terms_templates FOR SELECT
USING (is_active = true);

CREATE TRIGGER set_terms_templates_updated_at
BEFORE UPDATE ON public.instructor_terms_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.pupil_terms_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.instructor_terms_templates(id),
  template_version INTEGER NOT NULL,
  signed_at TIMESTAMPTZ,
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pupil_terms_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view own pupil agreements"
ON public.pupil_terms_agreements FOR SELECT
TO authenticated
USING (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

CREATE POLICY "Instructors can create agreements"
ON public.pupil_terms_agreements FOR INSERT
TO authenticated
WITH CHECK (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

CREATE POLICY "Public can view by token"
ON public.pupil_terms_agreements FOR SELECT
USING (true);

CREATE POLICY "Public can update by token"
ON public.pupil_terms_agreements FOR UPDATE
USING (true);

-- =============================================
-- FEATURE 5: GDPR Auto-Cleanup
-- =============================================

ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS data_retention_months INTEGER DEFAULT 36;

-- =============================================
-- FEATURE 6: Theory Test Progress - already has theory_test_attempts
-- Add a mock_scores table for manual logging
-- =============================================

CREATE TABLE IF NOT EXISTS public.theory_mock_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 50,
  test_type TEXT NOT NULL DEFAULT 'multiple_choice',
  source TEXT DEFAULT 'manual',
  notes TEXT,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.theory_mock_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own mock scores"
ON public.theory_mock_scores FOR ALL
TO authenticated
USING (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

CREATE POLICY "Pupils can view own mock scores"
ON public.theory_mock_scores FOR SELECT
USING (true);

CREATE POLICY "Pupils can insert own mock scores"
ON public.theory_mock_scores FOR INSERT
WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expense_receipts_instructor ON public.expense_receipts(instructor_id);
CREATE INDEX IF NOT EXISTS idx_terms_agreements_pupil ON public.pupil_terms_agreements(pupil_id);
CREATE INDEX IF NOT EXISTS idx_terms_agreements_token ON public.pupil_terms_agreements(token);
CREATE INDEX IF NOT EXISTS idx_theory_mock_scores_pupil ON public.theory_mock_scores(pupil_id, test_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_checkin ON public.scheduled_lessons(check_in_status) WHERE check_in_status IS NOT NULL;
