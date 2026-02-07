
-- Add Quartix-specific columns to gps_devices
ALTER TABLE public.gps_devices 
  ADD COLUMN IF NOT EXISTS quartix_vehicle_id text,
  ADD COLUMN IF NOT EXISTS quartix_driver_id text,
  ADD COLUMN IF NOT EXISTS tracking_provider text NOT NULL DEFAULT 'gpsgate';

-- Create instructor_tracking_config table
CREATE TABLE public.instructor_tracking_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL UNIQUE REFERENCES public.instructors(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'gpsgate',
  quartix_account_id text,
  quartix_api_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.instructor_tracking_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can read own tracking config"
  ON public.instructor_tracking_config FOR SELECT
  TO authenticated
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can upsert own tracking config"
  ON public.instructor_tracking_config FOR INSERT
  TO authenticated
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update own tracking config"
  ON public.instructor_tracking_config FOR UPDATE
  TO authenticated
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can read all tracking configs"
  ON public.instructor_tracking_config FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_instructor_tracking_config_updated_at
  BEFORE UPDATE ON public.instructor_tracking_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create quartix_driver_scores table
CREATE TABLE public.quartix_driver_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id uuid REFERENCES public.pupils(id) ON DELETE SET NULL,
  quartix_driver_id text NOT NULL,
  score_date date NOT NULL,
  overall_score numeric,
  speed_score numeric,
  acceleration_score numeric,
  braking_score numeric,
  cornering_score numeric,
  fatigue_score numeric,
  raw_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, quartix_driver_id, score_date)
);

ALTER TABLE public.quartix_driver_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can read own driver scores"
  ON public.quartix_driver_scores FOR SELECT
  TO authenticated
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can read all driver scores"
  ON public.quartix_driver_scores FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for performance
CREATE INDEX idx_quartix_driver_scores_instructor ON public.quartix_driver_scores(instructor_id, score_date DESC);
CREATE INDEX idx_gps_devices_tracking_provider ON public.gps_devices(tracking_provider);
CREATE INDEX idx_instructor_tracking_config_provider ON public.instructor_tracking_config(provider);
