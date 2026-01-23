-- Create examiners table for storing examiner details
CREATE TABLE public.examiners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dvsa_staff_number TEXT,
  test_centre_id UUID REFERENCES public.test_centres(id) ON DELETE SET NULL,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create driving_test_results table for detailed DL25A form data
CREATE TABLE public.driving_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  examiner_id UUID REFERENCES public.examiners(id) ON DELETE SET NULL,
  test_date DATE NOT NULL,
  test_time TIME,
  test_centre_id UUID REFERENCES public.test_centres(id) ON DELETE SET NULL,
  is_mock BOOLEAN NOT NULL DEFAULT false,
  result TEXT NOT NULL CHECK (result IN ('pass', 'fail')),
  application_ref TEXT,
  cat_type TEXT DEFAULT 'Manual',
  adi_cert_no TEXT,
  faults JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_minor_faults INTEGER NOT NULL DEFAULT 0,
  total_serious_faults INTEGER NOT NULL DEFAULT 0,
  total_dangerous_faults INTEGER NOT NULL DEFAULT 0,
  examiner_took_action BOOLEAN NOT NULL DEFAULT false,
  eta_code TEXT,
  survey_answers JSONB,
  debrief_activity_code TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create instructor_standards_check table for tracking DVSA trigger metrics
CREATE TABLE public.instructor_standards_check (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_tests INTEGER NOT NULL DEFAULT 0,
  avg_minor_faults NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_serious_faults NUMERIC(5,2) NOT NULL DEFAULT 0,
  physical_action_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  pass_rate_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  triggers_met INTEGER NOT NULL DEFAULT 0,
  trigger_details JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Enable RLS on all tables
ALTER TABLE public.examiners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driving_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_standards_check ENABLE ROW LEVEL SECURITY;

-- RLS policies for examiners
CREATE POLICY "Instructors can view their own examiners"
  ON public.examiners FOR SELECT
  USING (instructor_id = (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can create examiners"
  ON public.examiners FOR INSERT
  WITH CHECK (instructor_id = (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update their own examiners"
  ON public.examiners FOR UPDATE
  USING (instructor_id = (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can delete their own examiners"
  ON public.examiners FOR DELETE
  USING (instructor_id = (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- RLS policies for driving_test_results
CREATE POLICY "Instructors can view their own test results"
  ON public.driving_test_results FOR SELECT
  USING (instructor_id = (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can create test results"
  ON public.driving_test_results FOR INSERT
  WITH CHECK (instructor_id = (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update their own test results"
  ON public.driving_test_results FOR UPDATE
  USING (instructor_id = (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can delete their own test results"
  ON public.driving_test_results FOR DELETE
  USING (instructor_id = (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- RLS policies for instructor_standards_check
CREATE POLICY "Instructors can view their own standards check"
  ON public.instructor_standards_check FOR SELECT
  USING (instructor_id = (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can manage their own standards check"
  ON public.instructor_standards_check FOR ALL
  USING (instructor_id = (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Create trigger for updating updated_at on driving_test_results
CREATE TRIGGER update_driving_test_results_updated_at
  BEFORE UPDATE ON public.driving_test_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_driving_test_results_pupil ON public.driving_test_results(pupil_id);
CREATE INDEX idx_driving_test_results_instructor ON public.driving_test_results(instructor_id);
CREATE INDEX idx_driving_test_results_date ON public.driving_test_results(test_date);
CREATE INDEX idx_driving_test_results_is_mock ON public.driving_test_results(is_mock);
CREATE INDEX idx_examiners_instructor ON public.examiners(instructor_id);
CREATE INDEX idx_instructor_standards_check_instructor ON public.instructor_standards_check(instructor_id);