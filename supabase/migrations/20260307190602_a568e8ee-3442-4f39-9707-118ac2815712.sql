
-- 1. Pupil milestones table
CREATE TABLE public.pupil_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pupil_milestones_instructor ON public.pupil_milestones(instructor_id, created_at DESC);

ALTER TABLE public.pupil_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can read own pupil milestones"
  ON public.pupil_milestones FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "System can insert milestones"
  ON public.pupil_milestones FOR INSERT TO authenticated
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- 2. Broadcast templates table
CREATE TABLE public.broadcast_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.broadcast_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read system and own templates"
  ON public.broadcast_templates FOR SELECT TO authenticated
  USING (is_system = true OR instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can insert own templates"
  ON public.broadcast_templates FOR INSERT TO authenticated
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()) AND is_system = false);

CREATE POLICY "Instructors can delete own templates"
  ON public.broadcast_templates FOR DELETE TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()) AND is_system = false);

-- 3. Add delivered_at to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
