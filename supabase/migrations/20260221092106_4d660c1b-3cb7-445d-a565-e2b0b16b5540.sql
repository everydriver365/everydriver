
-- ============================================
-- Phase 1: Lesson Packages & Pupil Packages
-- ============================================

CREATE TABLE public.lesson_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_hours NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage their own packages"
  ON public.lesson_packages FOR ALL
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Pupils can view active packages"
  ON public.lesson_packages FOR SELECT
  USING (is_active = true);

CREATE TRIGGER update_lesson_packages_updated_at
  BEFORE UPDATE ON public.lesson_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pupil packages (tracking purchased packages)
CREATE TABLE public.pupil_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.lesson_packages(id) ON DELETE CASCADE,
  hours_purchased NUMERIC NOT NULL,
  hours_remaining NUMERIC NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pupil_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage pupil packages"
  ON public.pupil_packages FOR ALL
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE TRIGGER update_pupil_packages_updated_at
  BEFORE UPDATE ON public.pupil_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Phase 2: Lesson Reminders Log
-- ============================================

CREATE TABLE public.lesson_reminders_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.scheduled_lessons(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id UUID REFERENCES public.pupils(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent',
  error TEXT
);

ALTER TABLE public.lesson_reminders_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view their reminder logs"
  ON public.lesson_reminders_log FOR SELECT
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Service role can insert reminder logs"
  ON public.lesson_reminders_log FOR INSERT
  WITH CHECK (true);

-- ============================================
-- Phase 6: Onboarding Tour Column
-- ============================================

ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS has_completed_tour BOOLEAN NOT NULL DEFAULT false;
