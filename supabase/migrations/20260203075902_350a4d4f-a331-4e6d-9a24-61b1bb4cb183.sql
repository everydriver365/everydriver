-- Add GPSgate-specific columns to traccar_devices table
ALTER TABLE public.traccar_devices
ADD COLUMN IF NOT EXISTS gpsgate_user_id INTEGER,
ADD COLUMN IF NOT EXISTS last_gpsgate_track_time TIMESTAMP WITH TIME ZONE;

-- Add comment to clarify the table now supports both Traccar and GPSgate
COMMENT ON TABLE public.traccar_devices IS 'GPS tracking devices - supports Traccar and GPSgate integrations';
COMMENT ON COLUMN public.traccar_devices.gpsgate_user_id IS 'GPSgate internal user ID for this device';
COMMENT ON COLUMN public.traccar_devices.last_gpsgate_track_time IS 'Timestamp of last processed GPSgate track point';