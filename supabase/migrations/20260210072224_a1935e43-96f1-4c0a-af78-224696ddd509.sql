
-- Add moderation columns
ALTER TABLE public.course_reviews 
  ADD COLUMN moderation_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN reviewer_email text,
  ADD COLUMN moderation_note text;

-- Migrate existing data: visible = approved, hidden = rejected
UPDATE public.course_reviews SET moderation_status = 'approved' WHERE is_visible = true;
UPDATE public.course_reviews SET moderation_status = 'rejected' WHERE is_visible = false;

-- RLS: allow anonymous inserts for public review form
CREATE POLICY "Anyone can submit a review"
  ON public.course_reviews FOR INSERT
  WITH CHECK (true);

-- Instructors can read their own reviews (all statuses)
CREATE POLICY "Instructors can view own reviews"
  ON public.course_reviews FOR SELECT TO authenticated
  USING (instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  ));

-- Instructors can update moderation status on their own reviews
CREATE POLICY "Instructors can moderate own reviews"
  ON public.course_reviews FOR UPDATE TO authenticated
  USING (instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  ))
  WITH CHECK (instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  ));
