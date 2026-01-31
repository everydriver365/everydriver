-- Create table for battery history (for tracking battery levels over time)
CREATE TABLE public.traccar_battery_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.traccar_devices(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  battery_percent INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_traccar_battery_history_device_time ON public.traccar_battery_history(device_id, recorded_at DESC);
CREATE INDEX idx_traccar_battery_history_instructor ON public.traccar_battery_history(instructor_id);

-- Enable RLS
ALTER TABLE public.traccar_battery_history ENABLE ROW LEVEL SECURITY;

-- Policies for battery history
CREATE POLICY "Instructors can view their own battery history"
ON public.traccar_battery_history FOR SELECT
USING (auth.uid() IN (
  SELECT auth_user_id FROM public.instructors WHERE id = instructor_id
));

-- Create table for ignition events (on/off tracking)
CREATE TABLE public.traccar_ignition_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.traccar_devices(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.instructor_vehicles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('on', 'off')),
  latitude NUMERIC,
  longitude NUMERIC,
  road_name TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for ignition events
CREATE INDEX idx_traccar_ignition_events_device_time ON public.traccar_ignition_events(device_id, recorded_at DESC);
CREATE INDEX idx_traccar_ignition_events_instructor ON public.traccar_ignition_events(instructor_id);
CREATE INDEX idx_traccar_ignition_events_vehicle ON public.traccar_ignition_events(vehicle_id);

-- Enable RLS
ALTER TABLE public.traccar_ignition_events ENABLE ROW LEVEL SECURITY;

-- Policies for ignition events
CREATE POLICY "Instructors can view their own ignition events"
ON public.traccar_ignition_events FOR SELECT
USING (auth.uid() IN (
  SELECT auth_user_id FROM public.instructors WHERE id = instructor_id
));