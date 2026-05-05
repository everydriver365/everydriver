
-- 1. Table
CREATE TABLE public.phone_live_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id uuid NOT NULL,
  instructor_id uuid NOT NULL,
  session_id uuid,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  speed_kmh numeric DEFAULT 0,
  heading numeric,
  accuracy numeric,
  battery_level numeric,
  provider text NOT NULL DEFAULT 'phone',
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX phone_live_positions_pupil_unique
  ON public.phone_live_positions(pupil_id);

CREATE INDEX phone_live_positions_instructor_idx
  ON public.phone_live_positions(instructor_id);

CREATE INDEX phone_live_positions_recorded_idx
  ON public.phone_live_positions(recorded_at DESC);

-- 2. updated_at trigger
CREATE TRIGGER phone_live_positions_set_updated_at
BEFORE UPDATE ON public.phone_live_positions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. RLS
ALTER TABLE public.phone_live_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own pupil phone positions"
ON public.phone_live_positions
FOR SELECT
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors modify own pupil phone positions"
ON public.phone_live_positions
FOR ALL
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- 4. Realtime
ALTER TABLE public.phone_live_positions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.phone_live_positions;

-- 5. RPC for regular interval updates
CREATE OR REPLACE FUNCTION public.upsert_phone_live_position(
  p_pupil_id uuid,
  p_latitude numeric,
  p_longitude numeric,
  p_speed_kmh numeric DEFAULT 0,
  p_heading numeric DEFAULT NULL,
  p_accuracy numeric DEFAULT NULL,
  p_battery_level numeric DEFAULT NULL,
  p_session_id uuid DEFAULT NULL,
  p_provider text DEFAULT 'phone'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_instructor_id uuid;
  v_caller_instructor uuid;
  v_id uuid;
BEGIN
  SELECT instructor_id INTO v_instructor_id
  FROM public.pupils
  WHERE id = p_pupil_id;

  IF v_instructor_id IS NULL THEN
    RAISE EXCEPTION 'Pupil not found';
  END IF;

  v_caller_instructor := public.get_instructor_id_for_user(auth.uid());
  IF v_caller_instructor IS NULL OR v_caller_instructor <> v_instructor_id THEN
    RAISE EXCEPTION 'Not authorised to update this pupil position';
  END IF;

  INSERT INTO public.phone_live_positions (
    pupil_id, instructor_id, session_id,
    latitude, longitude, speed_kmh, heading, accuracy,
    battery_level, provider, recorded_at
  ) VALUES (
    p_pupil_id, v_instructor_id, p_session_id,
    p_latitude, p_longitude, p_speed_kmh, p_heading, p_accuracy,
    p_battery_level, COALESCE(p_provider, 'phone'), now()
  )
  ON CONFLICT (pupil_id) DO UPDATE SET
    instructor_id = EXCLUDED.instructor_id,
    session_id = EXCLUDED.session_id,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    speed_kmh = EXCLUDED.speed_kmh,
    heading = EXCLUDED.heading,
    accuracy = EXCLUDED.accuracy,
    battery_level = EXCLUDED.battery_level,
    provider = EXCLUDED.provider,
    recorded_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
