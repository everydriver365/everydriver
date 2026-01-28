-- Add speed limit column to traccar_devices
ALTER TABLE public.traccar_devices 
ADD COLUMN IF NOT EXISTS last_speed_limit_kmh NUMERIC DEFAULT NULL;

-- Enable realtime for traccar_devices
ALTER PUBLICATION supabase_realtime ADD TABLE public.traccar_devices;