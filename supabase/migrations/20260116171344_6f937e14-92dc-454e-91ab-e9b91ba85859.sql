-- ============================================
-- PUPIL REWARDS & REFERRAL SYSTEM
-- ============================================

-- Add rewards-related columns to pupils table
ALTER TABLE public.pupils 
ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_lessons_for_rewards INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_lessons_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_lessons_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by_pupil_id UUID REFERENCES public.pupils(id);

-- Create index for referral code lookups
CREATE INDEX IF NOT EXISTS idx_pupils_referral_code ON public.pupils(referral_code);

-- Create referral tracking table
CREATE TABLE IF NOT EXISTS public.pupil_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  referred_pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  bonus_points_awarded INTEGER DEFAULT 50,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referred_pupil_id)
);

-- Enable RLS on referrals
ALTER TABLE public.pupil_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for referrals"
ON public.pupil_referrals FOR SELECT
USING (true);

CREATE POLICY "Instructors can manage referrals"
ON public.pupil_referrals FOR ALL
USING (true);

-- Create rewards history table for tracking points
CREATE TABLE IF NOT EXISTS public.pupil_rewards_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL,
  reason TEXT NOT NULL,
  lesson_id UUID REFERENCES public.lesson_history(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rewards history
ALTER TABLE public.pupil_rewards_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for rewards history"
ON public.pupil_rewards_history FOR SELECT
USING (true);

CREATE POLICY "Instructors can insert rewards history"
ON public.pupil_rewards_history FOR INSERT
WITH CHECK (true);

-- ============================================
-- REAL-TIME SCHEDULE SYNC
-- ============================================

-- Enable realtime for scheduled_lessons
ALTER TABLE public.scheduled_lessons REPLICA IDENTITY FULL;

-- Add to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'scheduled_lessons'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_lessons;
  END IF;
END $$;

-- ============================================
-- USER PREFERENCES (for dark mode & language)
-- ============================================

-- Add preferences to instructors table
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS dark_mode_enabled BOOLEAN DEFAULT false;

-- Add preferences to pupils table  
ALTER TABLE public.pupils
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- Create function to generate referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate referral code for new pupils
CREATE OR REPLACE FUNCTION public.auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS generate_pupil_referral_code ON public.pupils;
CREATE TRIGGER generate_pupil_referral_code
  BEFORE INSERT ON public.pupils
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_referral_code();

-- Update existing pupils without referral codes
UPDATE public.pupils 
SET referral_code = public.generate_referral_code() 
WHERE referral_code IS NULL;