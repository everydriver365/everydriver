
-- Add ECU odometer start-of-day tracking
ALTER TABLE public.gps_devices 
ADD COLUMN IF NOT EXISTS daily_start_ecu_odometer_km numeric;

-- Add session start ECU odometer for accurate lesson distance
ALTER TABLE public.gps_devices 
ADD COLUMN IF NOT EXISTS session_start_ecu_odometer_km numeric;
