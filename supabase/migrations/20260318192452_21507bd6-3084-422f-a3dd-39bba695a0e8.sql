
-- Digital Waivers
CREATE TABLE public.digital_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  waiver_type TEXT NOT NULL DEFAULT 'terms',
  content_html TEXT NOT NULL DEFAULT '',
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.digital_waivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own waivers" ON public.digital_waivers
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Public read active waivers" ON public.digital_waivers
  FOR SELECT TO anon
  USING (is_active = true);

-- Waiver Signatures
CREATE TABLE public.waiver_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waiver_id UUID NOT NULL REFERENCES public.digital_waivers(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  signature_data TEXT,
  ip_address TEXT,
  parent_name TEXT,
  parent_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.waiver_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own signatures" ON public.waiver_signatures
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Abandoned Checkouts
CREATE TABLE public.abandoned_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_name TEXT,
  pupil_email TEXT,
  pupil_phone TEXT,
  booking_data JSONB DEFAULT '{}'::jsonb,
  resume_token TEXT DEFAULT encode(gen_random_bytes(16), 'hex'),
  reminder_sent_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own checkouts" ON public.abandoned_checkouts
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Pupil Certifications
CREATE TABLE public.pupil_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL DEFAULT 'course_complete',
  title TEXT NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pupil_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own certifications" ON public.pupil_certifications
  FOR ALL TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Add queue_position and claim_expires_at to slot_offers
ALTER TABLE public.slot_offers ADD COLUMN IF NOT EXISTS queue_position INTEGER DEFAULT 0;
ALTER TABLE public.slot_offers ADD COLUMN IF NOT EXISTS claim_expires_at TIMESTAMPTZ;
