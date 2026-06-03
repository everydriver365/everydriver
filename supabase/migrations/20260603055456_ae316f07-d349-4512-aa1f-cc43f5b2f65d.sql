
-- Geotab live data: odometer snapshots, fault dedup, device live cols
ALTER TABLE public.gps_devices
  ADD COLUMN IF NOT EXISTS last_odometer_km numeric,
  ADD COLUMN IF NOT EXISTS last_position_lat numeric,
  ADD COLUMN IF NOT EXISTS last_position_lng numeric;

ALTER TABLE public.geotab_fault_codes
  ADD COLUMN IF NOT EXISTS geotab_fault_id text;

CREATE UNIQUE INDEX IF NOT EXISTS geotab_fault_codes_unique_event
  ON public.geotab_fault_codes(device_id, geotab_fault_id)
  WHERE geotab_fault_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.geotab_odometer_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  device_id uuid NOT NULL REFERENCES public.gps_devices(id) ON DELETE CASCADE,
  odometer_km numeric NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.geotab_odometer_snapshots TO authenticated;
GRANT ALL ON public.geotab_odometer_snapshots TO service_role;

ALTER TABLE public.geotab_odometer_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors see own odometer snapshots"
  ON public.geotab_odometer_snapshots FOR SELECT TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Admins see all odometer snapshots"
  ON public.geotab_odometer_snapshots FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_geotab_odometer_device_captured
  ON public.geotab_odometer_snapshots(device_id, captured_at DESC);
