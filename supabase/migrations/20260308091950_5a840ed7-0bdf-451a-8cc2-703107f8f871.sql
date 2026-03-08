
-- Feature 1: Pipeline Board
CREATE TYPE public.pipeline_stage AS ENUM ('new_lead', 'contacted', 'quoted', 'booked', 'active', 'test_passed', 'lost');

CREATE TABLE public.pipeline_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  postcode TEXT,
  course_type TEXT,
  notes TEXT,
  stage pipeline_stage NOT NULL DEFAULT 'new_lead',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pipeline_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own leads" ON public.pipeline_leads
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE TRIGGER set_pipeline_leads_updated_at
  BEFORE UPDATE ON public.pipeline_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Feature 2: On-My-Way Notifications
CREATE TABLE public.on_my_way_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id UUID REFERENCES public.pupils(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES public.scheduled_lessons(id) ON DELETE SET NULL,
  eta_minutes INTEGER,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.on_my_way_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own notifications" ON public.on_my_way_notifications
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Feature 3: Workflow Automations
CREATE TYPE public.automation_trigger AS ENUM ('lesson_completed', 'cancellation', 'no_show', 'test_passed', 'payment_overdue', 'new_enquiry');
CREATE TYPE public.automation_action AS ENUM ('send_sms', 'send_email', 'add_note', 'move_pipeline', 'create_todo');

CREATE TABLE public.instructor_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type automation_trigger NOT NULL,
  action_type automation_action NOT NULL,
  action_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.instructor_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own automations" ON public.instructor_automations
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE TRIGGER set_instructor_automations_updated_at
  BEFORE UPDATE ON public.instructor_automations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Feature 4: AI Receptionist - add column to instructors
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS ai_receptionist_enabled BOOLEAN NOT NULL DEFAULT false;
