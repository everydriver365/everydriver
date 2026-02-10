
-- Driver timesheets auto-generated from Quartix trip data
CREATE TABLE public.driver_timesheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  sheet_date DATE NOT NULL,
  quartix_vehicle_id TEXT,
  first_trip_start TIMESTAMPTZ,
  last_trip_end TIMESTAMPTZ,
  total_driving_minutes NUMERIC DEFAULT 0,
  total_idle_minutes NUMERIC DEFAULT 0,
  total_distance_km NUMERIC DEFAULT 0,
  trip_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, sheet_date, quartix_vehicle_id)
);

ALTER TABLE public.driver_timesheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view own timesheets"
  ON public.driver_timesheets FOR SELECT
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Service role can manage timesheets"
  ON public.driver_timesheets FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_driver_timesheets_updated_at
  BEFORE UPDATE ON public.driver_timesheets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
