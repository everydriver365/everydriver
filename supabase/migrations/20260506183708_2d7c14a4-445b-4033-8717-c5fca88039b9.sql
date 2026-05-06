CREATE TABLE public.booking_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_name text NOT NULL,
  pupil_email text NOT NULL,
  pupil_phone text NOT NULL,
  pupil_postcode text,
  course_name text,
  course_hours numeric,
  message text,
  status text NOT NULL DEFAULT 'new',
  source text DEFAULT 'mini_website',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  contacted_at timestamptz,
  converted_pupil_id uuid REFERENCES public.pupils(id) ON DELETE SET NULL
);

ALTER TABLE public.booking_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an enquiry"
ON public.booking_enquiries FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Instructor can view own enquiries"
ON public.booking_enquiries FOR SELECT TO authenticated
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructor can update own enquiries"
ON public.booking_enquiries FOR UPDATE TO authenticated
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE TRIGGER trg_booking_enquiries_updated
  BEFORE UPDATE ON public.booking_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_booking_enquiries_instructor_status
  ON public.booking_enquiries(instructor_id, status, created_at DESC);