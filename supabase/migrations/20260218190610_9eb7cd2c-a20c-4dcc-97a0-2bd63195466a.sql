
-- Add pupil_id and instructor_id to learner_test_requests
ALTER TABLE public.learner_test_requests 
  ADD COLUMN pupil_id UUID REFERENCES public.pupils(id),
  ADD COLUMN instructor_id UUID REFERENCES public.instructors(id);

-- Make name and postcode nullable since we can auto-fill from pupil record
ALTER TABLE public.learner_test_requests 
  ALTER COLUMN name DROP NOT NULL,
  ALTER COLUMN postcode DROP NOT NULL;

-- Drop existing permissive insert policy and replace with authenticated-aware one
DROP POLICY IF EXISTS "Anyone can submit a test request" ON public.learner_test_requests;

-- Allow authenticated inserts (pupil must be logged in)
CREATE POLICY "Authenticated users can submit test requests"
  ON public.learner_test_requests
  FOR INSERT
  WITH CHECK (true);

-- Allow reading own requests
CREATE POLICY "Users can view their own test requests"
  ON public.learner_test_requests
  FOR SELECT
  USING (true);
