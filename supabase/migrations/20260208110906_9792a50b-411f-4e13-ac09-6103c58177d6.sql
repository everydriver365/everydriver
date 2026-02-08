-- Drop the GPSgate poller function
DROP FUNCTION IF EXISTS public.invoke_gpsgate_poller();

-- Update default tracking provider to quartix
ALTER TABLE public.gps_devices ALTER COLUMN tracking_provider SET DEFAULT 'quartix';

-- Update instructor_tracking_config default
ALTER TABLE public.instructor_tracking_config ALTER COLUMN provider SET DEFAULT 'quartix';

-- Update existing records from gpsgate to quartix
UPDATE public.gps_devices SET tracking_provider = 'quartix' WHERE tracking_provider = 'gpsgate';
UPDATE public.instructor_tracking_config SET provider = 'quartix' WHERE provider = 'gpsgate';