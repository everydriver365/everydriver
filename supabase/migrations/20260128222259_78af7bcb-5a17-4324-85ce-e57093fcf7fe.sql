-- Add road name column to traccar_devices
ALTER TABLE public.traccar_devices 
ADD COLUMN IF NOT EXISTS last_road_name TEXT DEFAULT NULL;