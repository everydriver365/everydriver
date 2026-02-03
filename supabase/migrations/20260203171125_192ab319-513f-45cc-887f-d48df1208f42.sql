-- =============================================
-- FEATURE 3: Speed Limit Caching
-- =============================================
CREATE TABLE public.speed_limit_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grid_lat NUMERIC(8,5) NOT NULL,
  grid_lng NUMERIC(8,5) NOT NULL,
  speed_limit_kmh INTEGER NOT NULL,
  road_name TEXT,
  road_type TEXT,
  source TEXT DEFAULT 'osm',
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  UNIQUE(grid_lat, grid_lng)
);

CREATE INDEX idx_speed_limit_cache_grid ON public.speed_limit_cache (grid_lat, grid_lng);
CREATE INDEX idx_speed_limit_cache_expires ON public.speed_limit_cache (expires_at);

ALTER TABLE public.speed_limit_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Speed limit cache is publicly readable"
  ON public.speed_limit_cache FOR SELECT
  USING (true);

-- =============================================
-- FEATURE 6: Fuel Log Tracking
-- =============================================
CREATE TABLE public.fuel_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.instructor_vehicles(id) ON DELETE SET NULL,
  fill_date DATE NOT NULL DEFAULT CURRENT_DATE,
  litres NUMERIC(6,2) NOT NULL,
  price_per_litre NUMERIC(5,3) NOT NULL,
  total_cost NUMERIC(8,2) GENERATED ALWAYS AS (litres * price_per_litre) STORED,
  odometer_reading_km NUMERIC(10,1),
  station_name TEXT,
  station_address TEXT,
  receipt_url TEXT,
  is_full_tank BOOLEAN DEFAULT true,
  notes TEXT,
  calculated_mpg NUMERIC(5,1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fuel_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view their own fuel logs"
  ON public.fuel_log FOR SELECT
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can insert their own fuel logs"
  ON public.fuel_log FOR INSERT
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update their own fuel logs"
  ON public.fuel_log FOR UPDATE
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can delete their own fuel logs"
  ON public.fuel_log FOR DELETE
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE INDEX idx_fuel_log_instructor ON public.fuel_log (instructor_id);
CREATE INDEX idx_fuel_log_date ON public.fuel_log (fill_date);

-- =============================================
-- FEATURE 7: Invoices
-- =============================================
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id UUID REFERENCES public.pupils(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'GBP',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
  payment_terms TEXT,
  notes TEXT,
  instructor_details JSONB,
  pupil_details JSONB,
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view their own invoices"
  ON public.invoices FOR SELECT
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can create their own invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update their own invoices"
  ON public.invoices FOR UPDATE
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can delete their own invoices"
  ON public.invoices FOR DELETE
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE INDEX idx_invoices_instructor ON public.invoices (instructor_id);
CREATE INDEX idx_invoices_pupil ON public.invoices (pupil_id);
CREATE INDEX idx_invoices_status ON public.invoices (status);

-- =============================================
-- FEATURE 9: Pre-Lesson Checklist
-- =============================================
CREATE TABLE public.pre_lesson_checklist_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL DEFAULT 'Default Checklist',
  is_first_lesson BOOLEAN NOT NULL DEFAULT false,
  items JSONB NOT NULL DEFAULT '[{"id": "licence", "label": "Provisional driving licence", "required": true}, {"id": "glasses", "label": "Glasses/contact lenses (if needed)", "required": false}, {"id": "shoes", "label": "Appropriate footwear", "required": true}]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pre_lesson_checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage their own checklist templates"
  ON public.pre_lesson_checklist_templates FOR ALL
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE TABLE public.pre_lesson_checklist_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.scheduled_lessons(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.pre_lesson_checklist_templates(id) ON DELETE SET NULL,
  completed_items JSONB NOT NULL DEFAULT '[]',
  all_required_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pre_lesson_checklist_completions ENABLE ROW LEVEL SECURITY;

-- Instructors can view completions for lessons they teach
CREATE POLICY "Instructors can view checklist completions"
  ON public.pre_lesson_checklist_completions FOR SELECT
  USING (pupil_id IN (
    SELECT p.id FROM public.pupils p
    JOIN public.instructors i ON i.id = p.instructor_id
    WHERE i.auth_user_id = auth.uid()
  ));

-- Pupils can manage their own completions (via lesson lookup)
CREATE POLICY "Allow insert for scheduled lessons"
  ON public.pre_lesson_checklist_completions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for own completions"
  ON public.pre_lesson_checklist_completions FOR UPDATE
  USING (true);

-- =============================================
-- FEATURE 10: Automated Follow-Ups
-- =============================================
CREATE TABLE public.followup_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('post_lesson', 'inactive', 'test_prep', 'booking_prompt', 'custom')),
  trigger_name TEXT NOT NULL,
  delay_hours INTEGER NOT NULL DEFAULT 24,
  sms_template TEXT,
  email_template TEXT,
  email_subject TEXT,
  is_enabled BOOLEAN DEFAULT true,
  send_sms BOOLEAN DEFAULT true,
  send_email BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.followup_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage their own followup templates"
  ON public.followup_templates FOR ALL
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE TABLE public.followup_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.followup_templates(id) ON DELETE SET NULL,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  message_content TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  booked_lesson_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  error TEXT
);

ALTER TABLE public.followup_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view their own followup logs"
  ON public.followup_log FOR SELECT
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE INDEX idx_followup_log_instructor ON public.followup_log (instructor_id);
CREATE INDEX idx_followup_log_pupil ON public.followup_log (pupil_id);

-- =============================================
-- FEATURE 11: Churn Detection
-- =============================================
CREATE TABLE public.pupil_churn_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE UNIQUE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  risk_score NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 1),
  risk_level TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN risk_score >= 0.7 THEN 'high'
      WHEN risk_score >= 0.4 THEN 'medium'
      ELSE 'low'
    END
  ) STORED,
  risk_factors JSONB NOT NULL DEFAULT '{}',
  recommended_actions JSONB NOT NULL DEFAULT '[]',
  days_since_last_lesson INTEGER,
  lesson_frequency_trend NUMERIC(4,2),
  cancellation_rate NUMERIC(3,2),
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pupil_churn_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view their pupils churn scores"
  ON public.pupil_churn_scores FOR SELECT
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE INDEX idx_churn_scores_instructor ON public.pupil_churn_scores (instructor_id);
CREATE INDEX idx_churn_scores_risk ON public.pupil_churn_scores (risk_level);

-- Add updated_at triggers
CREATE TRIGGER update_fuel_log_updated_at
  BEFORE UPDATE ON public.fuel_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklist_templates_updated_at
  BEFORE UPDATE ON public.pre_lesson_checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_followup_templates_updated_at
  BEFORE UPDATE ON public.followup_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_churn_scores_updated_at
  BEFORE UPDATE ON public.pupil_churn_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();