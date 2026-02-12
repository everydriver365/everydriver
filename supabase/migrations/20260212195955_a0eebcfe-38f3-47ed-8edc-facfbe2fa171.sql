
-- Add enriched metadata columns to dashcam_media
ALTER TABLE public.dashcam_media
  ADD COLUMN IF NOT EXISTS driver_id text,
  ADD COLUMN IF NOT EXISTS driver_name text,
  ADD COLUMN IF NOT EXISTS event_tags text[],
  ADD COLUMN IF NOT EXISTS g_force numeric,
  ADD COLUMN IF NOT EXISTS camera_angle text,
  ADD COLUMN IF NOT EXISTS resolution text,
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS processing_status text,
  ADD COLUMN IF NOT EXISTS speed_at_event_kmh numeric,
  ADD COLUMN IF NOT EXISTS road_name text;

-- Add last_ignition_status to gps_devices
ALTER TABLE public.gps_devices
  ADD COLUMN IF NOT EXISTS last_ignition_status boolean;

-- Index for filtering by event tags (GIN for array search)
CREATE INDEX IF NOT EXISTS idx_dashcam_media_event_tags ON public.dashcam_media USING GIN(event_tags);

-- Index for G-force incident filtering
CREATE INDEX IF NOT EXISTS idx_dashcam_media_g_force ON public.dashcam_media (g_force) WHERE g_force IS NOT NULL;
