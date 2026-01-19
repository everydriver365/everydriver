-- Create reward_tiers table for defining badge tiers and perks
CREATE TABLE public.reward_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  color TEXT NOT NULL DEFAULT '#FFD700',
  min_points INTEGER NOT NULL DEFAULT 0,
  perks JSONB DEFAULT '[]'::jsonb,
  badge_image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pupil_badges table to track unlocked badges
CREATE TABLE public.pupil_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.reward_tiers(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pupil_id, tier_id)
);

-- Enable RLS
ALTER TABLE public.reward_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pupil_badges ENABLE ROW LEVEL SECURITY;

-- Reward tiers are readable by everyone (public display)
CREATE POLICY "Reward tiers are viewable by everyone" 
ON public.reward_tiers 
FOR SELECT 
USING (true);

-- Pupil badges viewable by everyone (public)
CREATE POLICY "Pupil badges are viewable by everyone" 
ON public.pupil_badges 
FOR SELECT 
USING (true);

-- Instructors can insert pupil badges
CREATE POLICY "Instructors can insert pupil badges" 
ON public.pupil_badges 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pupils p 
    WHERE p.id = pupil_id 
    AND p.instructor_id IN (
      SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
    )
  )
);

-- Insert default reward tiers
INSERT INTO public.reward_tiers (name, icon, color, min_points, perks, display_order) VALUES
('Starter', '🌟', '#94A3B8', 0, '["Welcome to the journey!", "Access to theory resources"]', 1),
('Bronze Driver', '🥉', '#CD7F32', 100, '["5% off next lesson package", "Priority booking for popular times"]', 2),
('Silver Driver', '🥈', '#C0C0C0', 250, '["10% off next lesson package", "Free theory practice tests", "Birthday lesson discount"]', 3),
('Gold Driver', '🥇', '#FFD700', 500, '["15% off next lesson package", "Free mock test session", "Priority instructor support"]', 4),
('Platinum Driver', '💎', '#E5E4E2', 1000, '["20% off lesson packages", "Free intensive course upgrade", "VIP scheduling access", "Exclusive rewards"]', 5),
('Road Master', '👑', '#9333EA', 2000, '["25% off everything", "Free advanced driving course", "Lifetime VIP status", "Personal driving coach"]', 6);

-- Create trigger for updating timestamps
CREATE TRIGGER update_reward_tiers_updated_at
BEFORE UPDATE ON public.reward_tiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();