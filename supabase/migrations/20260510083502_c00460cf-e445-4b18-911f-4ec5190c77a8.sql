-- Enums for instructor phone numbers
CREATE TYPE public.phone_number_provider AS ENUM ('twilio_provisioned', 'byo_forwarded');
CREATE TYPE public.phone_number_routing_mode AS ENUM ('ai', 'mobile', 'schedule');
CREATE TYPE public.phone_number_status AS ENUM ('active', 'releasing', 'released');

CREATE TABLE public.instructor_phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL UNIQUE,
  provider public.phone_number_provider NOT NULL,
  twilio_sid TEXT,
  routing_mode public.phone_number_routing_mode NOT NULL DEFAULT 'schedule',
  forward_to_mobile TEXT,
  monthly_cost_pence INTEGER,
  status public.phone_number_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_instructor_phone_numbers_instructor ON public.instructor_phone_numbers(instructor_id);
CREATE INDEX idx_instructor_phone_numbers_lookup ON public.instructor_phone_numbers(phone_number) WHERE status = 'active';

ALTER TABLE public.instructor_phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view their own phone numbers"
ON public.instructor_phone_numbers FOR SELECT
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors update their own phone numbers"
ON public.instructor_phone_numbers FOR UPDATE
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE TRIGGER update_instructor_phone_numbers_updated_at
BEFORE UPDATE ON public.instructor_phone_numbers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();