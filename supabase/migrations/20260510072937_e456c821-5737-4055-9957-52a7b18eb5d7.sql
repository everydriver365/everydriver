ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS standards_check_at timestamptz,
  ADD COLUMN IF NOT EXISTS standards_check_result text;

ALTER TABLE public.instructors
  DROP CONSTRAINT IF EXISTS instructors_standards_check_result_check;

ALTER TABLE public.instructors
  ADD CONSTRAINT instructors_standards_check_result_check
  CHECK (standards_check_result IS NULL OR standards_check_result IN ('grade_a','grade_b','fail','pending'));