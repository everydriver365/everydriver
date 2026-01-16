-- Add Damoov fields to pupils table for gamification
ALTER TABLE public.pupils
ADD COLUMN IF NOT EXISTS damoov_device_token text,
ADD COLUMN IF NOT EXISTS drive_coins integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_trips integer DEFAULT 0;

-- Add Damoov fields to lesson_telematics for ML scoring
ALTER TABLE public.lesson_telematics
ADD COLUMN IF NOT EXISTS damoov_trip_token text,
ADD COLUMN IF NOT EXISTS damoov_overall_score numeric,
ADD COLUMN IF NOT EXISTS damoov_acceleration_score numeric,
ADD COLUMN IF NOT EXISTS damoov_braking_score numeric,
ADD COLUMN IF NOT EXISTS damoov_cornering_score numeric,
ADD COLUMN IF NOT EXISTS damoov_speeding_score numeric,
ADD COLUMN IF NOT EXISTS damoov_phone_score numeric,
ADD COLUMN IF NOT EXISTS damoov_crash_detected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS damoov_crash_timestamp timestamptz;

-- Create pupil leaderboard table
CREATE TABLE IF NOT EXISTS public.pupil_leaderboard (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id uuid NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  weekly_score numeric DEFAULT 0,
  weekly_coins_earned integer DEFAULT 0,
  rank integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(pupil_id, week_start)
);

-- Enable RLS on leaderboard
ALTER TABLE public.pupil_leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS policies for pupil_leaderboard
CREATE POLICY "Instructors can view their pupils leaderboard"
ON public.pupil_leaderboard
FOR SELECT
USING (
  instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "System can insert leaderboard entries"
ON public.pupil_leaderboard
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update leaderboard entries"
ON public.pupil_leaderboard
FOR UPDATE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_pupil_leaderboard_updated_at
BEFORE UPDATE ON public.pupil_leaderboard
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_week_instructor 
ON public.pupil_leaderboard(week_start, instructor_id);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rank 
ON public.pupil_leaderboard(week_start, instructor_id, rank);