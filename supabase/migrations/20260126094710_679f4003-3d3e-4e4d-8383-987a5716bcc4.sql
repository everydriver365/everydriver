-- Create table to track gap offers sent to pupils
CREATE TABLE public.gap_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  pupil_phone TEXT NOT NULL,
  slot_date DATE NOT NULL,
  slot_start_time TEXT NOT NULL,
  slot_end_time TEXT NOT NULL,
  discount_type TEXT,
  discount_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  twilio_message_sid TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  response_message TEXT
);

-- Enable RLS
ALTER TABLE public.gap_offers ENABLE ROW LEVEL SECURITY;

-- Policies for instructors to view their own offers
CREATE POLICY "Instructors can view their own gap offers"
  ON public.gap_offers FOR SELECT
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can insert their own gap offers"
  ON public.gap_offers FOR INSERT
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Service role needs full access for webhook processing
CREATE POLICY "Service role has full access to gap_offers"
  ON public.gap_offers FOR ALL
  USING (auth.role() = 'service_role');

-- Index for quick lookups by phone and status
CREATE INDEX idx_gap_offers_phone_status ON public.gap_offers(pupil_phone, status);
CREATE INDEX idx_gap_offers_instructor_status ON public.gap_offers(instructor_id, status);