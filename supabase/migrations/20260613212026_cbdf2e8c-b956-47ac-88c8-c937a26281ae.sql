CREATE UNIQUE INDEX IF NOT EXISTS pupils_unique_active_name_per_instructor
  ON public.pupils (instructor_id, lower(btrim(name)))
  WHERE deleted_at IS NULL;