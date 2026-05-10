ALTER TABLE public.instructors DROP CONSTRAINT IF EXISTS instructors_adi_grade_check;
ALTER TABLE public.instructors ADD CONSTRAINT instructors_adi_grade_check
  CHECK (adi_grade IS NULL OR adi_grade = ANY (ARRAY['A','B','PDI','PDI-1','PDI-2','PDI-3']));