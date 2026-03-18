
-- AI Command Logs
CREATE TABLE public.ai_command_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  command_text TEXT NOT NULL,
  parsed_intent TEXT,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_command_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own command logs"
  ON public.ai_command_logs
  FOR ALL
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Automation Workflows (multi-step)
CREATE TABLE public.automation_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own workflows"
  ON public.automation_workflows
  FOR ALL
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE TRIGGER set_automation_workflows_updated_at
  BEFORE UPDATE ON public.automation_workflows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
