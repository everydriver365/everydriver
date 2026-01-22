-- Create table for raw motion sensor data (replaces local detection)
CREATE TABLE public.telematics_motion_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telematics_id UUID NOT NULL REFERENCES public.lesson_telematics(id) ON DELETE CASCADE,
  acceleration_x NUMERIC,
  acceleration_y NUMERIC, 
  acceleration_z NUMERIC,
  rotation_alpha NUMERIC,
  rotation_beta NUMERIC,
  rotation_gamma NUMERIC,
  g_force NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_telematics_motion_raw_session ON public.telematics_motion_raw(telematics_id, recorded_at);

-- Enable RLS
ALTER TABLE public.telematics_motion_raw ENABLE ROW LEVEL SECURITY;

-- RLS policies for motion data
CREATE POLICY "Instructors can view motion data for their sessions"
ON public.telematics_motion_raw
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_telematics lt
    WHERE lt.id = telematics_motion_raw.telematics_id
    AND lt.instructor_id = auth.uid()
  )
);

CREATE POLICY "Service role can insert motion data"
ON public.telematics_motion_raw
FOR INSERT
WITH CHECK (true);

-- Create table for real-time alerts (server-side detection)
CREATE TABLE public.telematics_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telematics_id UUID NOT NULL REFERENCES public.lesson_telematics(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('speeding', 'harsh_brake', 'harsh_accel', 'phone_usage', 'sharp_turn')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  speed_kmh NUMERIC,
  speed_limit_kmh NUMERIC,
  speed_delta NUMERIC,
  latitude NUMERIC,
  longitude NUMERIC,
  road_name TEXT,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for alerts
CREATE INDEX idx_telematics_alerts_session ON public.telematics_alerts(telematics_id, created_at DESC);
CREATE INDEX idx_telematics_alerts_unacked ON public.telematics_alerts(telematics_id) WHERE acknowledged = false;

-- Enable RLS
ALTER TABLE public.telematics_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for alerts
CREATE POLICY "Instructors can view alerts for their sessions"
ON public.telematics_alerts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_telematics lt
    WHERE lt.id = telematics_alerts.telematics_id
    AND lt.instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can update alerts for their sessions"
ON public.telematics_alerts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_telematics lt
    WHERE lt.id = telematics_alerts.telematics_id
    AND lt.instructor_id = auth.uid()
  )
);

CREATE POLICY "Service role can insert alerts"
ON public.telematics_alerts
FOR INSERT
WITH CHECK (true);

-- Enable Supabase Realtime for alerts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.telematics_alerts;

-- Create function for server-side alert detection on GPS point insert
CREATE OR REPLACE FUNCTION public.check_gps_point_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev_point RECORD;
  time_diff NUMERIC;
BEGIN
  -- Get previous point for this session
  SELECT speed_kmh, speed_limit_kmh, recorded_at INTO prev_point
  FROM public.telematics_gps_points
  WHERE telematics_id = NEW.telematics_id
    AND recorded_at < NEW.recorded_at
  ORDER BY recorded_at DESC
  LIMIT 1;
  
  -- Skip if no previous point or new point has no speed
  IF prev_point IS NULL OR NEW.speed_kmh IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate time difference in seconds
  time_diff := EXTRACT(EPOCH FROM (NEW.recorded_at - prev_point.recorded_at));
  
  -- Skip if points are too far apart (> 10 seconds, likely GPS gap)
  IF time_diff > 10 OR time_diff <= 0 THEN
    RETURN NEW;
  END IF;
  
  -- Check speeding (if speed limit known, allow 5 km/h buffer)
  IF NEW.speed_limit_kmh IS NOT NULL AND NEW.speed_kmh > NEW.speed_limit_kmh + 5 THEN
    INSERT INTO public.telematics_alerts (
      telematics_id, alert_type, severity, speed_kmh, speed_limit_kmh, 
      speed_delta, latitude, longitude, road_name
    )
    VALUES (
      NEW.telematics_id, 
      'speeding', 
      CASE 
        WHEN NEW.speed_kmh > NEW.speed_limit_kmh + 20 THEN 'high'
        WHEN NEW.speed_kmh > NEW.speed_limit_kmh + 10 THEN 'medium'
        ELSE 'low'
      END,
      NEW.speed_kmh, 
      NEW.speed_limit_kmh,
      NEW.speed_kmh - NEW.speed_limit_kmh,
      NEW.latitude, 
      NEW.longitude,
      NEW.road_name
    );
  END IF;
  
  -- Check harsh braking (speed drop > 20 km/h in short time)
  IF prev_point.speed_kmh IS NOT NULL AND prev_point.speed_kmh - NEW.speed_kmh > 20 THEN
    INSERT INTO public.telematics_alerts (
      telematics_id, alert_type, severity, speed_kmh, speed_delta, latitude, longitude
    )
    VALUES (
      NEW.telematics_id, 
      'harsh_brake', 
      CASE 
        WHEN prev_point.speed_kmh - NEW.speed_kmh > 35 THEN 'high'
        WHEN prev_point.speed_kmh - NEW.speed_kmh > 25 THEN 'medium'
        ELSE 'low'
      END,
      NEW.speed_kmh,
      prev_point.speed_kmh - NEW.speed_kmh,
      NEW.latitude, 
      NEW.longitude
    );
  END IF;
  
  -- Check harsh acceleration (speed increase > 15 km/h in short time)
  IF prev_point.speed_kmh IS NOT NULL AND NEW.speed_kmh - prev_point.speed_kmh > 15 THEN
    INSERT INTO public.telematics_alerts (
      telematics_id, alert_type, severity, speed_kmh, speed_delta, latitude, longitude
    )
    VALUES (
      NEW.telematics_id, 
      'harsh_accel', 
      CASE 
        WHEN NEW.speed_kmh - prev_point.speed_kmh > 25 THEN 'high'
        WHEN NEW.speed_kmh - prev_point.speed_kmh > 18 THEN 'medium'
        ELSE 'low'
      END,
      NEW.speed_kmh,
      NEW.speed_kmh - prev_point.speed_kmh,
      NEW.latitude, 
      NEW.longitude
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for real-time alert detection
CREATE TRIGGER gps_point_alert_check
AFTER INSERT ON public.telematics_gps_points
FOR EACH ROW EXECUTE FUNCTION public.check_gps_point_alerts();