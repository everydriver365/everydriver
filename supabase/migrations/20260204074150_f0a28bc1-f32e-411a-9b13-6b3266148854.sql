-- Add heartbeat tracking column to gps_devices
ALTER TABLE public.gps_devices 
ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ;