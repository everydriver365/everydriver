ALTER TABLE public.instructor_courses
  ADD COLUMN IF NOT EXISTS offer_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS offer_label text,
  ADD COLUMN IF NOT EXISTS offer_percent_off numeric,
  ADD COLUMN IF NOT EXISTS offer_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS offer_ends_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_instructor_courses_offer_active
  ON public.instructor_courses (offer_active) WHERE offer_active = true;