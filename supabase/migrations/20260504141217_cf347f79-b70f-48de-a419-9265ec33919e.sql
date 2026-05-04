
CREATE TABLE public.ai_reschedule_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.scheduled_lessons(id) ON DELETE CASCADE,
  pupil_id UUID REFERENCES public.pupils(id) ON DELETE SET NULL,
  source_channel TEXT NOT NULL CHECK (source_channel IN ('whatsapp','webchat','phone_in','phone_out')),
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  original_start TIMESTAMPTZ NOT NULL,
  original_duration_minutes INTEGER NOT NULL,
  requested_start TIMESTAMPTZ NOT NULL,
  requested_duration_minutes INTEGER NOT NULL CHECK (requested_duration_minutes >= 30 AND requested_duration_minutes <= 480),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','auto_approved','declined','expired')),
  auto_approved BOOLEAN NOT NULL DEFAULT false,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ai_reschedule_requests_instructor_idx
  ON public.ai_reschedule_requests (instructor_id, status, created_at DESC);

CREATE INDEX ai_reschedule_requests_lesson_idx
  ON public.ai_reschedule_requests (lesson_id);

ALTER TABLE public.ai_reschedule_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own reschedule requests"
  ON public.ai_reschedule_requests
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Admins view all reschedule requests"
  ON public.ai_reschedule_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update all reschedule requests"
  ON public.ai_reschedule_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "School owners view reschedule requests"
  ON public.ai_reschedule_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.school_instructors si
    JOIN public.schools s ON s.id = si.school_id
    WHERE si.instructor_id = ai_reschedule_requests.instructor_id
      AND s.owner_user_id = auth.uid()
  ));

CREATE TRIGGER ai_reschedule_requests_updated_at
  BEFORE UPDATE ON public.ai_reschedule_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
