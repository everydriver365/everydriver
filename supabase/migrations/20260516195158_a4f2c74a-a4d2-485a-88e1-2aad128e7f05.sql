
ALTER TABLE public.instructor_working_hours
  ADD CONSTRAINT instructor_working_hours_dow_range_chk
  CHECK (day_of_week >= 0 AND day_of_week <= 6);

ALTER TABLE public.availability_windows
  ADD CONSTRAINT availability_windows_dow_range_chk
  CHECK (day_of_week >= 1 AND day_of_week <= 7);
