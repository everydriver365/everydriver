CREATE TABLE public.pupil_swap_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id uuid NOT NULL UNIQUE REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  opted_in boolean NOT NULL DEFAULT false,
  email_notifications boolean NOT NULL DEFAULT true,
  sms_notifications boolean NOT NULL DEFAULT false,
  test_date date,
  test_time time,
  test_centre text,
  preference text NOT NULL DEFAULT 'earlier' CHECK (preference IN ('earlier','later','any')),
  consent_given boolean NOT NULL DEFAULT false,
  consent_timestamp timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pupil_swap_profile_instructor ON public.pupil_swap_profile(instructor_id);

ALTER TABLE public.pupil_swap_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructor can view their pupils' swap profiles"
ON public.pupil_swap_profile FOR SELECT
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructor can manage their pupils' swap profiles"
ON public.pupil_swap_profile FOR ALL
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Public can read swap profiles for matching"
ON public.pupil_swap_profile FOR SELECT
USING (opted_in = true);

CREATE TRIGGER trg_pupil_swap_profile_updated_at
BEFORE UPDATE ON public.pupil_swap_profile
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();