ALTER TABLE public.course_reviews
  ADD COLUMN IF NOT EXISTS reviewer_location text,
  ADD COLUMN IF NOT EXISTS passed_first_time boolean;