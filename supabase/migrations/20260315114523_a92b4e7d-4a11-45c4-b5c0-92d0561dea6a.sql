
CREATE TABLE public.booking_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  phone text,
  name text,
  instructor_id uuid REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  course_name text,
  course_hours integer,
  total_price numeric,
  form_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  converted_at timestamptz,
  follow_up_sent_at timestamptz
);

ALTER TABLE public.booking_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create booking drafts"
  ON public.booking_drafts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Instructors can view their booking drafts"
  ON public.booking_drafts FOR SELECT
  TO authenticated
  USING (instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  ));

CREATE INDEX idx_booking_drafts_instructor_unconverted
  ON public.booking_drafts (instructor_id, created_at DESC)
  WHERE converted_at IS NULL;

CREATE TRIGGER set_booking_drafts_updated_at
  BEFORE UPDATE ON public.booking_drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
