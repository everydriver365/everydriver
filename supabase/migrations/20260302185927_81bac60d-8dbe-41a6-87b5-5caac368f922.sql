
-- Quotes table for bookable estimates
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  postcode TEXT,
  course_type TEXT,
  package_details TEXT,
  total_hours NUMERIC,
  price NUMERIC NOT NULL,
  deposit_amount NUMERIC,
  schedule_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own quotes"
  ON public.quotes FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Public can view quotes by token"
  ON public.quotes FOR SELECT TO anon
  USING (true);

-- Booking intake questions
CREATE TABLE public.booking_intake_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  options JSONB,
  display_order INT NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_intake_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own intake questions"
  ON public.booking_intake_questions FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Public can view active intake questions"
  ON public.booking_intake_questions FOR SELECT TO anon
  USING (is_active = true);

-- Booking intake answers
CREATE TABLE public.booking_intake_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.booking_intake_questions(id) ON DELETE CASCADE,
  pupil_id UUID REFERENCES public.pupils(id) ON DELETE SET NULL,
  enquiry_id UUID REFERENCES public.course_enquiries(id) ON DELETE SET NULL,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_intake_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view own intake answers"
  ON public.booking_intake_answers FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.booking_intake_questions q 
    WHERE q.id = question_id 
    AND q.instructor_id = public.get_instructor_id_for_user(auth.uid())
  ));

CREATE POLICY "Public can insert intake answers"
  ON public.booking_intake_answers FOR INSERT TO anon
  WITH CHECK (true);

-- Pricing rules
CREATE TABLE public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  condition JSONB NOT NULL DEFAULT '{}',
  adjustment_type TEXT NOT NULL DEFAULT 'flat',
  adjustment_value NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own pricing rules"
  ON public.pricing_rules FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Add payment_token to invoices (if invoices table doesn't exist, we skip)
-- Check if scheduled_lessons already has the columns we need
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduled_lessons' AND column_name = 'payment_token') THEN
    ALTER TABLE public.scheduled_lessons ADD COLUMN payment_token TEXT;
  END IF;
END $$;
