
-- Platform fees ledger: tracks the £1 platform fee added to each booking
CREATE TABLE public.platform_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID REFERENCES public.pupils(id) ON DELETE SET NULL,
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE SET NULL,
  booking_reference TEXT,
  amount NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  currency TEXT NOT NULL DEFAULT 'GBP',
  source TEXT NOT NULL DEFAULT 'booking',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_platform_fees_created_at ON public.platform_fees (created_at DESC);
CREATE INDEX idx_platform_fees_instructor ON public.platform_fees (instructor_id);
CREATE INDEX idx_platform_fees_pupil ON public.platform_fees (pupil_id);

ALTER TABLE public.platform_fees ENABLE ROW LEVEL SECURITY;

-- Only admins can read platform fees
CREATE POLICY "Admins can view platform fees"
ON public.platform_fees FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Instructors can view their own platform fees (for transparency)
CREATE POLICY "Instructors can view their own platform fees"
ON public.platform_fees FOR SELECT
TO authenticated
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));
