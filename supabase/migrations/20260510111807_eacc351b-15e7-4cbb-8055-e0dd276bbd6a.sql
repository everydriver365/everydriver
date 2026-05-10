ALTER TABLE public.pupils
  ADD COLUMN IF NOT EXISTS travel_time_minutes integer
  CHECK (travel_time_minutes IS NULL OR (travel_time_minutes >= 0 AND travel_time_minutes <= 240));

COMMENT ON COLUMN public.pupils.travel_time_minutes IS
  'Per-pupil travel time override in minutes. When set, replaces the instructor default buffer when this pupil sits adjacent to another lesson. NULL means use instructor.buffer_minutes.';