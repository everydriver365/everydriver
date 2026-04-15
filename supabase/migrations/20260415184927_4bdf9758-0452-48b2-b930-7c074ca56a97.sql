ALTER TABLE public.gps_devices
  ADD COLUMN IF NOT EXISTS last_dashcam_active boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_panic_pressed boolean DEFAULT false;