-- Add new columns to driving_behavior_events for motion sensor data
ALTER TABLE public.driving_behavior_events 
ADD COLUMN IF NOT EXISTS g_force numeric,
ADD COLUMN IF NOT EXISTS sensor_source text DEFAULT 'gps';

-- Add GPS accuracy tracking to telematics_gps_points
ALTER TABLE public.telematics_gps_points 
ADD COLUMN IF NOT EXISTS gps_accuracy_m numeric;

-- Add comment for documentation
COMMENT ON COLUMN public.driving_behavior_events.g_force IS 'G-force magnitude at time of event';
COMMENT ON COLUMN public.driving_behavior_events.sensor_source IS 'Source of detection: gps, motion, or both';
COMMENT ON COLUMN public.telematics_gps_points.gps_accuracy_m IS 'GPS accuracy in meters at time of recording';