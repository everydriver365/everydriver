
-- Feature 4: Recurring Subscriptions table
CREATE TABLE public.pupil_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id uuid NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL,
  start_time text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  pickup_postcode text,
  pickup_address text,
  price_per_lesson numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'active',
  next_lesson_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pupil_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own subscriptions"
  ON public.pupil_subscriptions FOR ALL
  TO authenticated
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Allow anon/public read for pupil portal (pupils use OTP, not auth)
CREATE POLICY "Public can read subscriptions"
  ON public.pupil_subscriptions FOR SELECT
  TO anon
  USING (true);

CREATE TRIGGER set_pupil_subscriptions_updated_at
  BEFORE UPDATE ON public.pupil_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
