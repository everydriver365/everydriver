
-- Table: geotab_driver_events
CREATE TABLE public.geotab_driver_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.gps_devices(id),
  event_type TEXT NOT NULL, -- harsh_brake, harsh_accel, harsh_corner, speeding
  rule_name TEXT,
  severity TEXT NOT NULL DEFAULT 'low', -- low, medium, high
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  speed_kmh DOUBLE PRECISION,
  duration_seconds INTEGER,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  geotab_event_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.geotab_driver_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view own driver events"
  ON public.geotab_driver_events FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Service can insert driver events"
  ON public.geotab_driver_events FOR INSERT TO authenticated
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Table: geotab_fuel_usage
CREATE TABLE public.geotab_fuel_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.gps_devices(id),
  trip_start TIMESTAMPTZ,
  trip_end TIMESTAMPTZ,
  fuel_used_litres DOUBLE PRECISION,
  distance_km DOUBLE PRECISION,
  litres_per_100km DOUBLE PRECISION,
  cost_gbp DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.geotab_fuel_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view own fuel usage"
  ON public.geotab_fuel_usage FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Service can insert fuel usage"
  ON public.geotab_fuel_usage FOR INSERT TO authenticated
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Table: geotab_impact_events
CREATE TABLE public.geotab_impact_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.gps_devices(id),
  g_force DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  speed_kmh DOUBLE PRECISION,
  event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  severity TEXT NOT NULL DEFAULT 'low', -- low, medium, high, critical
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  geotab_event_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.geotab_impact_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view own impact events"
  ON public.geotab_impact_events FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can update own impact events"
  ON public.geotab_impact_events FOR UPDATE TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Service can insert impact events"
  ON public.geotab_impact_events FOR INSERT TO authenticated
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_geotab_driver_events_instructor ON public.geotab_driver_events(instructor_id, started_at DESC);
CREATE INDEX idx_geotab_fuel_usage_instructor ON public.geotab_fuel_usage(instructor_id, trip_start DESC);
CREATE INDEX idx_geotab_impact_events_instructor ON public.geotab_impact_events(instructor_id, event_time DESC);
