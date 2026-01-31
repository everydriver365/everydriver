-- Create vehicle_security_settings table
CREATE TABLE public.vehicle_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.instructor_vehicles(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  security_enabled BOOLEAN NOT NULL DEFAULT false,
  movement_threshold_kmh NUMERIC NOT NULL DEFAULT 5,
  alert_cooldown_minutes INTEGER NOT NULL DEFAULT 30,
  notify_on_ignition BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vehicle_id)
);

-- Create vehicle_security_alerts table
CREATE TABLE public.vehicle_security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.instructor_vehicles(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.traccar_devices(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('unexpected_movement', 'ignition_on', 'geofence_exit')),
  latitude NUMERIC,
  longitude NUMERIC,
  speed_kmh NUMERIC,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notification_sent BOOLEAN NOT NULL DEFAULT false,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.vehicle_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_security_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for vehicle_security_settings
CREATE POLICY "Instructors can view own security settings"
  ON public.vehicle_security_settings
  FOR SELECT
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can insert own security settings"
  ON public.vehicle_security_settings
  FOR INSERT
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update own security settings"
  ON public.vehicle_security_settings
  FOR UPDATE
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can delete own security settings"
  ON public.vehicle_security_settings
  FOR DELETE
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- RLS policies for vehicle_security_alerts
CREATE POLICY "Instructors can view own security alerts"
  ON public.vehicle_security_alerts
  FOR SELECT
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update own security alerts"
  ON public.vehicle_security_alerts
  FOR UPDATE
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Service role can insert alerts (from edge functions)
CREATE POLICY "Service role can insert alerts"
  ON public.vehicle_security_alerts
  FOR INSERT
  WITH CHECK (true);

-- Create trigger for updated_at on security settings
CREATE TRIGGER update_vehicle_security_settings_updated_at
  BEFORE UPDATE ON public.vehicle_security_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_security_alerts;

-- Create index for faster alert lookups
CREATE INDEX idx_security_alerts_vehicle_triggered 
  ON public.vehicle_security_alerts(vehicle_id, triggered_at DESC);

CREATE INDEX idx_security_settings_vehicle 
  ON public.vehicle_security_settings(vehicle_id);