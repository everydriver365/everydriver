-- Create pupil_syllabus_progress table for tracking individual competency levels
CREATE TABLE public.pupil_syllabus_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  competency_id TEXT NOT NULL,
  level INTEGER DEFAULT 0 CHECK (level >= 0 AND level <= 5),
  instructor_notes TEXT,
  last_practiced DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pupil_id, competency_id)
);

-- Create syllabus_templates table for custom syllabuses
CREATE TABLE public.syllabus_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  competencies JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create reflective_logs table for post-lesson reflections
CREATE TABLE public.reflective_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  lesson_history_id UUID REFERENCES public.lesson_history(id) ON DELETE SET NULL,
  what_went_well TEXT,
  improvements TEXT,
  next_goals TEXT,
  instructor_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add recurrence columns to scheduled_lessons for weekly repeating lessons
ALTER TABLE public.scheduled_lessons 
ADD COLUMN IF NOT EXISTS recurrence_rule TEXT,
ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES public.scheduled_lessons(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.pupil_syllabus_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflective_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pupil_syllabus_progress
CREATE POLICY "Instructors can manage their pupils syllabus progress"
ON public.pupil_syllabus_progress
FOR ALL
TO authenticated
USING (
  pupil_id IN (SELECT id FROM public.pupils WHERE instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()))
)
WITH CHECK (
  pupil_id IN (SELECT id FROM public.pupils WHERE instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()))
);

CREATE POLICY "Pupils can view their own syllabus progress"
ON public.pupil_syllabus_progress
FOR SELECT
TO anon, authenticated
USING (true);

-- RLS Policies for syllabus_templates
CREATE POLICY "Instructors can manage their own syllabus templates"
ON public.syllabus_templates
FOR ALL
TO authenticated
USING (
  instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid())
)
WITH CHECK (
  instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Anyone can view syllabus templates"
ON public.syllabus_templates
FOR SELECT
TO anon, authenticated
USING (true);

-- RLS Policies for reflective_logs
CREATE POLICY "Instructors can manage their pupils reflective logs"
ON public.reflective_logs
FOR ALL
TO authenticated
USING (
  pupil_id IN (SELECT id FROM public.pupils WHERE instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()))
)
WITH CHECK (
  pupil_id IN (SELECT id FROM public.pupils WHERE instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()))
);

CREATE POLICY "Pupils can manage their own reflective logs"
ON public.reflective_logs
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_pupil_syllabus_progress_updated_at
  BEFORE UPDATE ON public.pupil_syllabus_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_syllabus_templates_updated_at
  BEFORE UPDATE ON public.syllabus_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reflective_logs_updated_at
  BEFORE UPDATE ON public.reflective_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for syllabus progress
ALTER PUBLICATION supabase_realtime ADD TABLE public.pupil_syllabus_progress;