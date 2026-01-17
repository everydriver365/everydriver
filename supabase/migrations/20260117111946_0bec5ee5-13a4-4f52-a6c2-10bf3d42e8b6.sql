-- Feature 8: Lesson Cancellation Request System
CREATE TABLE public.lesson_cancellation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.scheduled_lessons(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  requested_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  instructor_notes TEXT,
  charge_applied BOOLEAN DEFAULT false,
  charge_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lesson_cancellation_requests ENABLE ROW LEVEL SECURITY;

-- Policies for cancellation requests
CREATE POLICY "Instructors can manage their cancellation requests"
  ON public.lesson_cancellation_requests FOR ALL
  USING (instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Public can create cancellation requests"
  ON public.lesson_cancellation_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view cancellation requests"
  ON public.lesson_cancellation_requests FOR SELECT
  USING (true);

-- Feature 9: Enhance Test Centres Table
ALTER TABLE public.test_centres
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS opening_hours TEXT,
ADD COLUMN IF NOT EXISTS facilities JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS parking_info TEXT,
ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
ADD COLUMN IF NOT EXISTS average_wait_weeks INTEGER,
ADD COLUMN IF NOT EXISTS pass_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS tips TEXT,
ADD COLUMN IF NOT EXISTS lat DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS lng DECIMAL(11,8);

-- Feature 10: Add test result tracking to pupils
ALTER TABLE public.pupils
ADD COLUMN IF NOT EXISTS test_passed BOOLEAN,
ADD COLUMN IF NOT EXISTS test_result_date DATE,
ADD COLUMN IF NOT EXISTS test_attempts INTEGER DEFAULT 0;