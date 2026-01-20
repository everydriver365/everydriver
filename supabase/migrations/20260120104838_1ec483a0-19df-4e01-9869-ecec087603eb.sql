-- Add road name and speed limit columns to telematics_gps_points
ALTER TABLE public.telematics_gps_points 
ADD COLUMN IF NOT EXISTS road_name TEXT,
ADD COLUMN IF NOT EXISTS speed_limit_kmh NUMERIC;

-- Create index on telematics_id for faster queries
CREATE INDEX IF NOT EXISTS idx_telematics_gps_points_telematics_id 
ON public.telematics_gps_points(telematics_id);