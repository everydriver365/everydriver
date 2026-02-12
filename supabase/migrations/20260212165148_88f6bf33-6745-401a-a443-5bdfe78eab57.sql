
-- Add geotab_device_id to gps_devices if not exists
ALTER TABLE public.gps_devices ADD COLUMN IF NOT EXISTS geotab_device_id TEXT;

-- Create dashcam_media table
CREATE TABLE public.dashcam_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.gps_devices(id) ON DELETE SET NULL,
  lesson_telematics_id UUID REFERENCES public.lesson_telematics(id) ON DELETE SET NULL,
  geotab_media_file_id TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'video' CHECK (media_type IN ('video', 'image')),
  file_name TEXT,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_incident BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('pending', 'available', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(geotab_media_file_id)
);

-- Enable RLS
ALTER TABLE public.dashcam_media ENABLE ROW LEVEL SECURITY;

-- Instructor can view their own dashcam media
CREATE POLICY "Instructors can view own dashcam media"
  ON public.dashcam_media FOR SELECT
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Admins can view all dashcam media
CREATE POLICY "Admins can manage all dashcam media"
  ON public.dashcam_media FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role inserts (from edge functions) - allow insert for authenticated with admin check
-- Edge functions use service role key which bypasses RLS

-- Indexes
CREATE INDEX idx_dashcam_media_instructor ON public.dashcam_media(instructor_id);
CREATE INDEX idx_dashcam_media_device ON public.dashcam_media(device_id);
CREATE INDEX idx_dashcam_media_recorded ON public.dashcam_media(recorded_at DESC);
CREATE INDEX idx_dashcam_media_incident ON public.dashcam_media(is_incident) WHERE is_incident = true;
CREATE INDEX idx_gps_devices_geotab ON public.gps_devices(geotab_device_id) WHERE geotab_device_id IS NOT NULL;

-- Updated_at trigger
CREATE TRIGGER update_dashcam_media_updated_at
  BEFORE UPDATE ON public.dashcam_media
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for dashcam_media
ALTER PUBLICATION supabase_realtime ADD TABLE public.dashcam_media;
