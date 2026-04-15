
-- Safety: ensure overspeed_events table exists (no-op if migration A succeeded)
CREATE TABLE IF NOT EXISTS public.overspeed_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telematics_id uuid REFERENCES public.lesson_telematics(id) ON DELETE CASCADE,
  device_id uuid REFERENCES public.gps_devices(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL,
  speed_kmh numeric NOT NULL,
  speed_limit_kmh numeric NOT NULL,
  excess_kmh numeric NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  road_name text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(telematics_id, recorded_at)
);

CREATE INDEX IF NOT EXISTS idx_overspeed_events_device_recorded ON public.overspeed_events(device_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_overspeed_events_telematics ON public.overspeed_events(telematics_id);

-- Ensure RLS + policy exist
ALTER TABLE public.overspeed_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'overspeed_events' AND policyname = 'Instructors can view their own overspeed events'
  ) THEN
    CREATE POLICY "Instructors can view their own overspeed events"
    ON public.overspeed_events FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.gps_devices gd
      WHERE gd.id = overspeed_events.device_id
        AND gd.instructor_id = public.get_instructor_id_for_user(auth.uid())
    ));
  END IF;
END $$;

-- Ensure columns exist
ALTER TABLE public.telematics_gps_points ADD COLUMN IF NOT EXISTS is_speeding boolean DEFAULT false;
ALTER TABLE public.gps_devices ADD COLUMN IF NOT EXISTS last_is_speeding boolean DEFAULT false;
