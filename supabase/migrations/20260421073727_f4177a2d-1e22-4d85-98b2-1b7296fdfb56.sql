
CREATE TABLE public.tile_health_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ok','warn','fail')),
  latency_ms INTEGER NULL,
  details JSONB NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tile_health_checks_lookup
  ON public.tile_health_checks (instructor_id, source, checked_at DESC);

ALTER TABLE public.tile_health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own health checks"
  ON public.tile_health_checks FOR SELECT
  USING (
    instructor_id IS NULL
    OR instructor_id = public.get_instructor_id_for_user(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE TABLE public.instructor_health_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NULL,
  source TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('warn','fail')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_instructor_health_alerts_open
  ON public.instructor_health_alerts (instructor_id, source)
  WHERE resolved_at IS NULL;

ALTER TABLE public.instructor_health_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own health alerts"
  ON public.instructor_health_alerts FOR SELECT
  USING (
    instructor_id IS NULL
    OR instructor_id = public.get_instructor_id_for_user(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.instructor_health_alerts;
ALTER TABLE public.instructor_health_alerts REPLICA IDENTITY FULL;
