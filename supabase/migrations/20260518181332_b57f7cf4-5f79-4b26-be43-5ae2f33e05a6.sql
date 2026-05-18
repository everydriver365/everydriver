
ALTER TABLE public.instructor_courses
  ADD COLUMN IF NOT EXISTS is_bespoke boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS is_intensive boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_mode text NOT NULL DEFAULT 'template',
  ADD COLUMN IF NOT EXISTS flat_price numeric,
  ADD COLUMN IF NOT EXISTS hourly_rate_override numeric,
  ADD COLUMN IF NOT EXISTS available_weekdays smallint[],
  ADD COLUMN IF NOT EXISTS available_from date,
  ADD COLUMN IF NOT EXISTS available_to date,
  ADD COLUMN IF NOT EXISTS duration_days integer,
  ADD COLUMN IF NOT EXISTS display_order integer;

ALTER TABLE public.instructor_courses
  DROP CONSTRAINT IF EXISTS instructor_courses_price_mode_check;
ALTER TABLE public.instructor_courses
  ADD CONSTRAINT instructor_courses_price_mode_check
  CHECK (price_mode IN ('template','flat','hourly'));

-- Replace unique(instructor_id, course_hours) with a partial unique excluding bespoke rows
ALTER TABLE public.instructor_courses
  DROP CONSTRAINT IF EXISTS instructor_courses_instructor_id_course_hours_key;

CREATE UNIQUE INDEX IF NOT EXISTS instructor_courses_template_unique_idx
  ON public.instructor_courses (instructor_id, course_hours)
  WHERE is_bespoke = false;

CREATE INDEX IF NOT EXISTS instructor_courses_bespoke_idx
  ON public.instructor_courses (instructor_id) WHERE is_bespoke = true;
