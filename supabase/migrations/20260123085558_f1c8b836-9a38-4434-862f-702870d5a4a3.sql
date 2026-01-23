-- Add driving_behavior_events table for local event detection
CREATE TABLE IF NOT EXISTS public.driving_behavior_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telematics_id UUID REFERENCES public.lesson_telematics(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('harsh_brake', 'speeding', 'harsh_accel', 'sharp_turn')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  latitude NUMERIC,
  longitude NUMERIC,
  speed_kmh NUMERIC,
  speed_limit_kmh NUMERIC,
  duration_ms INTEGER,
  acceleration_ms2 NUMERIC,
  road_name TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driving_behavior_events ENABLE ROW LEVEL SECURITY;

-- Create policies - instructors can manage their own session events
CREATE POLICY "Instructors can view their session events"
ON public.driving_behavior_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_telematics lt
    WHERE lt.id = driving_behavior_events.telematics_id
    AND lt.instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can insert their session events"
ON public.driving_behavior_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lesson_telematics lt
    WHERE lt.id = driving_behavior_events.telematics_id
    AND lt.instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can delete their session events"
ON public.driving_behavior_events
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.lesson_telematics lt
    WHERE lt.id = driving_behavior_events.telematics_id
    AND lt.instructor_id = auth.uid()
  )
);

-- Add trip metadata columns to lesson_telematics for local scoring
ALTER TABLE public.lesson_telematics
ADD COLUMN IF NOT EXISTS harsh_brake_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS speeding_events_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS speeding_total_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_speed_over_limit_kmh NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS local_score INTEGER DEFAULT 100;

-- Create index for faster event lookups
CREATE INDEX IF NOT EXISTS idx_driving_behavior_events_telematics_id 
ON public.driving_behavior_events(telematics_id);

CREATE INDEX IF NOT EXISTS idx_driving_behavior_events_event_type 
ON public.driving_behavior_events(event_type);