-- =====================================================
-- PHASE 1: Core Tables and Functions for 8 Major Features
-- =====================================================

-- 1. OFFLINE SYNC QUEUE TABLE
CREATE TABLE public.offline_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('insert', 'update', 'delete')),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at TIMESTAMPTZ,
  error TEXT
);

ALTER TABLE public.offline_sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own sync queue"
ON public.offline_sync_queue FOR ALL
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

CREATE INDEX idx_offline_sync_queue_instructor ON public.offline_sync_queue(instructor_id);
CREATE INDEX idx_offline_sync_queue_pending ON public.offline_sync_queue(instructor_id) WHERE synced_at IS NULL;

-- 2. INSTRUCTOR BOOKING SETTINGS TABLE
CREATE TABLE public.instructor_booking_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL UNIQUE REFERENCES public.instructors(id) ON DELETE CASCADE,
  allow_self_booking BOOLEAN NOT NULL DEFAULT false,
  require_approval BOOLEAN NOT NULL DEFAULT true,
  min_notice_hours INTEGER NOT NULL DEFAULT 24,
  max_advance_days INTEGER NOT NULL DEFAULT 14,
  allowed_durations INTEGER[] NOT NULL DEFAULT '{60, 90, 120}',
  booking_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instructor_booking_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own booking settings"
ON public.instructor_booking_settings FOR ALL
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Pupils can view instructor booking settings"
ON public.instructor_booking_settings FOR SELECT
USING (true);

-- 3. LESSON VIDEO CLIPS TABLE
CREATE TABLE public.lesson_video_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telematics_id UUID REFERENCES public.lesson_telematics(id) ON DELETE SET NULL,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id UUID REFERENCES public.pupils(id) ON DELETE SET NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  clip_start_seconds INTEGER DEFAULT 0,
  clip_end_seconds INTEGER,
  instructor_note TEXT,
  clip_type TEXT NOT NULL DEFAULT 'general' CHECK (clip_type IN ('general', 'good_practice', 'needs_work', 'highlight')),
  gps_point_id UUID,
  is_shared_with_pupil BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_video_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own video clips"
ON public.lesson_video_clips FOR ALL
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Pupils can view shared clips"
ON public.lesson_video_clips FOR SELECT
USING (
  is_shared_with_pupil = true 
  AND pupil_id IN (SELECT id FROM public.pupils WHERE auth.uid() = instructor_id)
);

CREATE INDEX idx_video_clips_telematics ON public.lesson_video_clips(telematics_id);
CREATE INDEX idx_video_clips_instructor ON public.lesson_video_clips(instructor_id);
CREATE INDEX idx_video_clips_pupil ON public.lesson_video_clips(pupil_id);

-- 4. THEORY TEST ATTEMPTS TABLE
CREATE TABLE public.theory_test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL DEFAULT 'quick_5' CHECK (test_type IN ('quick_5', 'mock_50', 'hazard_perception')),
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_taken_seconds INTEGER,
  passed BOOLEAN NOT NULL DEFAULT false,
  weak_categories JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.theory_test_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage theory attempts for their pupils"
ON public.theory_test_attempts FOR ALL
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Pupils can view own theory attempts"
ON public.theory_test_attempts FOR SELECT
USING (pupil_id IN (SELECT id FROM public.pupils WHERE auth.uid() = instructor_id));

CREATE INDEX idx_theory_attempts_pupil ON public.theory_test_attempts(pupil_id);
CREATE INDEX idx_theory_attempts_instructor ON public.theory_test_attempts(instructor_id);

-- 5. THEORY QUESTIONS TABLE
CREATE TABLE public.theory_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('road_signs', 'rules', 'hazards', 'stopping_distances', 'vehicle_safety', 'vulnerable_road_users')),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.theory_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active theory questions"
ON public.theory_questions FOR SELECT
USING (is_active = true);

CREATE INDEX idx_theory_questions_category ON public.theory_questions(category);
CREATE INDEX idx_theory_questions_active ON public.theory_questions(is_active) WHERE is_active = true;

-- 6. REWARD REDEMPTIONS TABLE
CREATE TABLE public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('free_lesson', 'discount', 'merchandise')),
  reward_value NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'redeemed', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage redemptions for their pupils"
ON public.reward_redemptions FOR ALL
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Pupils can view own redemptions"
ON public.reward_redemptions FOR SELECT
USING (pupil_id IN (SELECT id FROM public.pupils WHERE auth.uid() = instructor_id));

CREATE INDEX idx_reward_redemptions_pupil ON public.reward_redemptions(pupil_id);
CREATE INDEX idx_reward_redemptions_status ON public.reward_redemptions(status);

-- 7. MODIFY SCHEDULED_LESSONS - Add booking_status and vehicle_id
ALTER TABLE public.scheduled_lessons 
ADD COLUMN IF NOT EXISTS booking_status TEXT DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'pending_approval', 'rejected')),
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.instructor_vehicles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_booking_status ON public.scheduled_lessons(booking_status);
CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_vehicle ON public.scheduled_lessons(vehicle_id);

-- 8. MODIFY INSTRUCTOR_VEHICLES - Add assigned_instructor_id and color_code
ALTER TABLE public.instructor_vehicles
ADD COLUMN IF NOT EXISTS assigned_instructor_id UUID REFERENCES public.instructors(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS color_code TEXT DEFAULT '#3B82F6';

-- 9. REFERRAL AUTOMATION FUNCTION
CREATE OR REPLACE FUNCTION public.award_referral_bonus()
RETURNS TRIGGER AS $$
BEGIN
  -- Only award when status changes from pending to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    -- Award points to referrer
    UPDATE public.pupils 
    SET reward_points = COALESCE(reward_points, 0) + 100
    WHERE id = NEW.referrer_pupil_id;
    
    -- Record points awarded on the referral
    NEW.bonus_points_awarded := 100;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. REFERRAL AUTOMATION TRIGGER
DROP TRIGGER IF EXISTS trigger_referral_complete ON public.pupil_referrals;
CREATE TRIGGER trigger_referral_complete
BEFORE UPDATE ON public.pupil_referrals
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.award_referral_bonus();

-- 11. Create storage bucket for lesson videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-videos', 'lesson-videos', false)
ON CONFLICT (id) DO NOTHING;

-- 12. Storage policies for lesson videos
CREATE POLICY "Instructors can upload own video clips"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can view own video clips"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lesson-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can delete own video clips"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lesson-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 13. Updated_at trigger for booking settings
CREATE TRIGGER update_booking_settings_updated_at
BEFORE UPDATE ON public.instructor_booking_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();