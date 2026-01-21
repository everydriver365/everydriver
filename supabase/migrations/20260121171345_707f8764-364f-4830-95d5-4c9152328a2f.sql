-- Waitlist table for pupils who want to be notified of available slots
CREATE TABLE public.lesson_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  preferred_days TEXT[] DEFAULT '{}',
  preferred_times TEXT[] DEFAULT '{}',
  min_duration_mins INTEGER DEFAULT 60,
  max_duration_mins INTEGER DEFAULT 120,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pupil_id, instructor_id)
);

-- Pending slot offers (requires instructor approval before sending to pupil)
CREATE TABLE public.slot_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  original_lesson_id UUID REFERENCES public.scheduled_lessons(id) ON DELETE SET NULL,
  lesson_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_mins INTEGER NOT NULL,
  instructor_approved BOOLEAN DEFAULT false,
  instructor_approved_at TIMESTAMPTZ,
  pupil_notified_at TIMESTAMPTZ,
  pupil_response TEXT DEFAULT 'pending' CHECK (pupil_response IN ('pending', 'accepted', 'declined', 'expired')),
  pupil_responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lesson_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_offers ENABLE ROW LEVEL SECURITY;

-- RLS policies for lesson_waitlist
CREATE POLICY "Instructors can view their waitlist entries"
ON public.lesson_waitlist FOR SELECT
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Instructors can manage waitlist"
ON public.lesson_waitlist FOR ALL
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Service role waitlist access"
ON public.lesson_waitlist FOR ALL
USING (true);

-- RLS policies for slot_offers
CREATE POLICY "Instructors can view slot offers"
ON public.slot_offers FOR SELECT
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Instructors can manage slot offers"
ON public.slot_offers FOR ALL
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Service role slot offers access"
ON public.slot_offers FOR ALL
USING (true);

-- Create indexes for performance
CREATE INDEX idx_lesson_waitlist_instructor ON public.lesson_waitlist(instructor_id);
CREATE INDEX idx_lesson_waitlist_active ON public.lesson_waitlist(is_active) WHERE is_active = true;
CREATE INDEX idx_slot_offers_instructor ON public.slot_offers(instructor_id);
CREATE INDEX idx_slot_offers_pending ON public.slot_offers(instructor_approved, pupil_response) 
  WHERE instructor_approved = false OR pupil_response = 'pending';