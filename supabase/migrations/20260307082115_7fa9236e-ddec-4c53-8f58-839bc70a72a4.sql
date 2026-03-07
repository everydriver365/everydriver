CREATE TABLE public.instructor_weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  report_text TEXT,
  lesson_count INTEGER DEFAULT 0,
  cancelled_count INTEGER DEFAULT 0,
  total_hours NUMERIC(5,1) DEFAULT 0,
  revenue INTEGER DEFAULT 0,
  expenses INTEGER DEFAULT 0,
  mileage_miles INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(instructor_id, week_start)
);

ALTER TABLE public.instructor_weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view own reports" ON public.instructor_weekly_reports
  FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Service role can manage reports" ON public.instructor_weekly_reports
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);