-- Create telematics_realtime_alerts table for driving events
CREATE TABLE IF NOT EXISTS public.telematics_realtime_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telematics_id UUID REFERENCES public.lesson_telematics(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'harsh_braking', 'harsh_acceleration', 'speeding'
  severity TEXT NOT NULL DEFAULT 'low', -- 'low', 'medium', 'high'
  speed_kmh NUMERIC,
  speed_limit_kmh NUMERIC,
  latitude NUMERIC,
  longitude NUMERIC,
  road_name TEXT,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries by session
CREATE INDEX idx_telematics_realtime_alerts_telematics_id ON public.telematics_realtime_alerts(telematics_id);
CREATE INDEX idx_telematics_realtime_alerts_type ON public.telematics_realtime_alerts(alert_type);

-- Add total_distance_km column to lesson_telematics if it doesn't exist
ALTER TABLE public.lesson_telematics ADD COLUMN IF NOT EXISTS total_distance_km NUMERIC DEFAULT 0;

-- Enable RLS
ALTER TABLE public.telematics_realtime_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for telematics_realtime_alerts
-- Instructors can view alerts for their sessions
CREATE POLICY "Instructors can view their session alerts"
ON public.telematics_realtime_alerts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_telematics lt
    WHERE lt.id = telematics_id
    AND lt.instructor_id = (
      SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
    )
  )
);

-- Allow insert from service role (webhook)
CREATE POLICY "Service can insert alerts"
ON public.telematics_realtime_alerts
FOR INSERT
WITH CHECK (true);

-- Instructors can update (acknowledge) their alerts
CREATE POLICY "Instructors can update their alerts"
ON public.telematics_realtime_alerts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_telematics lt
    WHERE lt.id = telematics_id
    AND lt.instructor_id = (
      SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
    )
  )
);

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.telematics_realtime_alerts;