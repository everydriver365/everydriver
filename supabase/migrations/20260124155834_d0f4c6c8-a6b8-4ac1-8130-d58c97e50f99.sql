-- Create table for live pupil positions (real-time streaming)
CREATE TABLE public.live_pupil_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  telematics_session_id UUID REFERENCES public.lesson_telematics(id) ON DELETE SET NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  speed_kmh NUMERIC DEFAULT 0,
  heading NUMERIC,
  accuracy NUMERIC,
  is_active BOOLEAN DEFAULT true,
  trip_status TEXT DEFAULT 'idle' CHECK (trip_status IN ('idle', 'driving', 'stopped', 'paused')),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint - one active position per pupil
CREATE UNIQUE INDEX idx_live_positions_pupil_active ON public.live_pupil_positions(pupil_id) WHERE is_active = true;
CREATE INDEX idx_live_positions_instructor ON public.live_pupil_positions(instructor_id, is_active);

-- Enable RLS
ALTER TABLE public.live_pupil_positions ENABLE ROW LEVEL SECURITY;

-- RLS policies - instructors can see their pupils' positions
CREATE POLICY "Instructors can view their pupils positions"
  ON public.live_pupil_positions FOR SELECT
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update their pupils positions"
  ON public.live_pupil_positions FOR ALL
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Service role policy for edge functions
CREATE POLICY "Service role full access to live positions"
  ON public.live_pupil_positions FOR ALL
  USING (true);

-- Create table for pupil driving achievements/badges
CREATE TABLE public.pupil_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  icon_name TEXT DEFAULT 'Award',
  coins_awarded INTEGER DEFAULT 0,
  UNIQUE(pupil_id, achievement_type)
);

-- Enable RLS
ALTER TABLE public.pupil_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for achievements (public read)
CREATE POLICY "Anyone can view achievements"
  ON public.pupil_achievements FOR SELECT USING (true);

CREATE POLICY "Service role can manage achievements"
  ON public.pupil_achievements FOR ALL USING (true);

-- Create table for AI coaching messages
CREATE TABLE public.pupil_coaching_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  message_type TEXT DEFAULT 'tip' CHECK (message_type IN ('tip', 'summary', 'motivation', 'warning')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  trip_reference UUID REFERENCES public.lesson_telematics(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_coaching_messages_pupil ON public.pupil_coaching_messages(pupil_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.pupil_coaching_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for coaching messages
CREATE POLICY "Anyone can view coaching messages"
  ON public.pupil_coaching_messages FOR SELECT USING (true);

CREATE POLICY "Service role can manage coaching messages"
  ON public.pupil_coaching_messages FOR ALL USING (true);

-- Add missing columns to pupils table for enhanced gamification
ALTER TABLE public.pupils 
  ADD COLUMN IF NOT EXISTS weekly_driving_score NUMERIC,
  ADD COLUMN IF NOT EXISTS monthly_driving_score NUMERIC,
  ADD COLUMN IF NOT EXISTS best_driving_score NUMERIC,
  ADD COLUMN IF NOT EXISTS total_distance_km NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_driving_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS speeding_events_total INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS harsh_brake_events_total INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_trip_at TIMESTAMP WITH TIME ZONE;

-- Enable realtime for live positions
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_pupil_positions;

-- Create function to update live position
CREATE OR REPLACE FUNCTION public.update_live_position(
  p_pupil_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_speed_kmh NUMERIC DEFAULT 0,
  p_heading NUMERIC DEFAULT NULL,
  p_accuracy NUMERIC DEFAULT NULL,
  p_trip_status TEXT DEFAULT 'driving',
  p_session_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_instructor_id UUID;
  v_position_id UUID;
BEGIN
  -- Get instructor ID for this pupil
  SELECT instructor_id INTO v_instructor_id FROM public.pupils WHERE id = p_pupil_id;
  
  IF v_instructor_id IS NULL THEN
    RAISE EXCEPTION 'Pupil not found';
  END IF;
  
  -- Upsert the live position
  INSERT INTO public.live_pupil_positions (
    pupil_id, instructor_id, telematics_session_id,
    latitude, longitude, speed_kmh, heading, accuracy,
    trip_status, is_active, updated_at
  ) VALUES (
    p_pupil_id, v_instructor_id, p_session_id,
    p_latitude, p_longitude, p_speed_kmh, p_heading, p_accuracy,
    p_trip_status, true, now()
  )
  ON CONFLICT (pupil_id) WHERE is_active = true
  DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    speed_kmh = EXCLUDED.speed_kmh,
    heading = EXCLUDED.heading,
    accuracy = EXCLUDED.accuracy,
    trip_status = EXCLUDED.trip_status,
    telematics_session_id = EXCLUDED.telematics_session_id,
    updated_at = now()
  RETURNING id INTO v_position_id;
  
  RETURN v_position_id;
END;
$$;