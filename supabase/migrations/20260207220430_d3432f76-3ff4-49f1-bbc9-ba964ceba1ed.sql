
-- ============================================
-- FEATURE 1: Lesson Reminders & No-Show Protection
-- ============================================

-- Add reminder tracking columns to scheduled_lessons
ALTER TABLE public.scheduled_lessons 
ADD COLUMN IF NOT EXISTS reminder_24h_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS reminder_1h_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS no_show_fee_charged numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS marked_no_show_at timestamptz;

-- Add no-show / cancellation policy to instructor_reminder_preferences
ALTER TABLE public.instructor_reminder_preferences
ADD COLUMN IF NOT EXISTS no_show_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_cancel_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_cancel_hours integer DEFAULT 24,
ADD COLUMN IF NOT EXISTS auto_charge_no_show boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_1h_enabled boolean DEFAULT true;

-- ============================================
-- FEATURE 4: Instructor Referral Settings
-- ============================================

-- Instructor-configurable referral reward settings
CREATE TABLE IF NOT EXISTS public.instructor_referral_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT true,
  referrer_reward_type text DEFAULT 'discount' CHECK (referrer_reward_type IN ('discount', 'credit', 'free_lesson', 'points')),
  referrer_reward_amount numeric DEFAULT 5,
  referee_reward_type text DEFAULT 'discount' CHECK (referee_reward_type IN ('discount', 'credit', 'free_lesson', 'points')),
  referee_reward_amount numeric DEFAULT 5,
  max_referrals_per_pupil integer DEFAULT 10,
  reward_description text DEFAULT 'Refer a friend and you both get £5 off!',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(instructor_id)
);

ALTER TABLE public.instructor_referral_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own referral settings"
  ON public.instructor_referral_settings
  FOR ALL
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()))
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- ============================================
-- FEATURE 6: Earnings Forecaster
-- ============================================

-- Cancellation tracking for forecaster accuracy
CREATE TABLE IF NOT EXISTS public.lesson_cancellation_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  month_year text NOT NULL, -- e.g. '2026-02'
  total_scheduled integer DEFAULT 0,
  total_completed integer DEFAULT 0,
  total_cancelled integer DEFAULT 0,
  total_no_show integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  avg_lesson_value numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(instructor_id, month_year)
);

ALTER TABLE public.lesson_cancellation_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view own cancellation stats"
  ON public.lesson_cancellation_stats
  FOR ALL
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()))
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_reminder_24h ON public.scheduled_lessons (lesson_date, status) WHERE reminder_24h_sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_scheduled_lessons_reminder_1h ON public.scheduled_lessons (lesson_date, start_time, status) WHERE reminder_1h_sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lesson_cancellation_stats_instructor ON public.lesson_cancellation_stats (instructor_id, month_year);
