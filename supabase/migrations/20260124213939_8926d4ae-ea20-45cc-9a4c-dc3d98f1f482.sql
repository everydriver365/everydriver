-- Create Traccar device registration table for instructor GPS tracking
CREATE TABLE public.traccar_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_identifier TEXT NOT NULL UNIQUE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  device_name TEXT DEFAULT 'My Device',
  current_pupil_id UUID REFERENCES public.pupils(id) ON DELETE SET NULL,
  current_session_id UUID REFERENCES public.lesson_telematics(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  last_speed_kmh NUMERIC,
  last_latitude NUMERIC,
  last_longitude NUMERIC,
  last_heading NUMERIC,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.traccar_devices ENABLE ROW LEVEL SECURITY;

-- Instructors can view their own devices
CREATE POLICY "Instructors can view their own devices"
ON public.traccar_devices
FOR SELECT
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

-- Instructors can insert their own devices
CREATE POLICY "Instructors can insert their own devices"
ON public.traccar_devices
FOR INSERT
WITH CHECK (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

-- Instructors can update their own devices
CREATE POLICY "Instructors can update their own devices"
ON public.traccar_devices
FOR UPDATE
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

-- Instructors can delete their own devices
CREATE POLICY "Instructors can delete their own devices"
ON public.traccar_devices
FOR DELETE
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

-- Service role policy for webhook updates (no auth context)
CREATE POLICY "Service role can update devices"
ON public.traccar_devices
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for fast device lookup by identifier
CREATE INDEX idx_traccar_devices_identifier ON public.traccar_devices(device_identifier);

-- Create index for instructor lookup
CREATE INDEX idx_traccar_devices_instructor ON public.traccar_devices(instructor_id);

-- Trigger for updated_at
CREATE TRIGGER update_traccar_devices_updated_at
BEFORE UPDATE ON public.traccar_devices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();