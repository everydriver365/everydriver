-- Create instructor_health_logs table for weight tracking
CREATE TABLE public.instructor_health_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg DECIMAL(5,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, log_date)
);

-- Create instructor_water_logs table for hydration tracking
CREATE TABLE public.instructor_water_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  glasses_count INTEGER NOT NULL DEFAULT 0,
  daily_goal INTEGER NOT NULL DEFAULT 8,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, log_date)
);

-- Create instructor_health_settings table for preferences
CREATE TABLE public.instructor_health_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE UNIQUE,
  weight_unit TEXT NOT NULL DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
  daily_water_goal INTEGER NOT NULL DEFAULT 8,
  break_reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_interval_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create health_tips table for curated tips
CREATE TABLE public.health_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('posture', 'hydration', 'eyes', 'movement', 'stress', 'nutrition', 'sleep')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Heart',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.instructor_health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_health_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_tips ENABLE ROW LEVEL SECURITY;

-- RLS policies for instructor_health_logs
CREATE POLICY "Instructors can view own health logs"
  ON public.instructor_health_logs FOR SELECT
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can insert own health logs"
  ON public.instructor_health_logs FOR INSERT
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update own health logs"
  ON public.instructor_health_logs FOR UPDATE
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can delete own health logs"
  ON public.instructor_health_logs FOR DELETE
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- RLS policies for instructor_water_logs
CREATE POLICY "Instructors can view own water logs"
  ON public.instructor_water_logs FOR SELECT
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can insert own water logs"
  ON public.instructor_water_logs FOR INSERT
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update own water logs"
  ON public.instructor_water_logs FOR UPDATE
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can delete own water logs"
  ON public.instructor_water_logs FOR DELETE
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- RLS policies for instructor_health_settings
CREATE POLICY "Instructors can view own health settings"
  ON public.instructor_health_settings FOR SELECT
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can insert own health settings"
  ON public.instructor_health_settings FOR INSERT
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update own health settings"
  ON public.instructor_health_settings FOR UPDATE
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- RLS policies for health_tips (public read)
CREATE POLICY "Anyone can view active health tips"
  ON public.health_tips FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage health tips"
  ON public.health_tips FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at on water_logs
CREATE TRIGGER update_instructor_water_logs_updated_at
  BEFORE UPDATE ON public.instructor_water_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on health_settings
CREATE TRIGGER update_instructor_health_settings_updated_at
  BEFORE UPDATE ON public.instructor_health_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for water logs (live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.instructor_water_logs;

-- Seed health tips with curated content for driving instructors
INSERT INTO public.health_tips (category, title, content, icon, display_order) VALUES
-- Posture tips
('posture', 'Adjust Your Seat Between Lessons', 'Even small changes to your seat position reduce pressure points and prevent stiffness. Try moving the seat 1cm forward or back between pupils.', 'Armchair', 1),
('posture', 'Check Your Mirror Angles', 'Readjusting mirrors forces you to check your posture. If mirrors look wrong, you might be slouching!', 'Eye', 2),
('posture', 'Lumbar Support Check', 'Make sure your lower back is supported. A small cushion can prevent hours of discomfort.', 'Heart', 3),
('posture', 'Steering Wheel Position', 'Arms should be slightly bent at the elbow when holding the wheel. Fully extended arms cause shoulder tension.', 'Gauge', 4),

-- Hydration tips
('hydration', 'Cup Holder Reminder', 'Keep a water bottle in your cup holder - aim for a sip every 15 minutes during gaps.', 'Droplets', 5),
('hydration', 'Start Your Day Right', 'Drink a full glass of water before your first lesson. Dehydration affects concentration.', 'GlassWater', 6),
('hydration', 'Tea Break Hydration', 'Coffee dehydrates - try to match each coffee with a glass of water.', 'Coffee', 7),
('hydration', 'Hydration Affects Focus', 'Even mild dehydration reduces reaction times. Stay hydrated for safer instruction.', 'Brain', 8),

-- Eye care tips
('eyes', '20-20-20 Rule', 'Every 20 minutes, look at something 20 feet away for 20 seconds. Great for red lights!', 'Eye', 9),
('eyes', 'Clean Your Windscreen', 'A spotless windscreen reduces eye strain from glare and smudges. Clean it weekly.', 'Sparkles', 10),
('eyes', 'Sunglasses Are Essential', 'Quality polarized sunglasses reduce eye strain significantly on bright days.', 'Sun', 11),
('eyes', 'Blink More Often', 'We blink less when concentrating. Conscious blinking prevents dry, tired eyes.', 'Eye', 12),

-- Movement tips
('movement', 'Walk Around Your Car', 'During a break, walk around your car once - it takes 30 seconds and helps circulation.', 'Footprints', 13),
('movement', 'Ankle Circles', 'At red lights, rotate your ankles in circles. Prevents stiffness from pedal work.', 'RotateCcw', 14),
('movement', 'Shoulder Shrugs', 'Raise shoulders to ears, hold 5 seconds, release. Do this at every test centre wait.', 'ArrowUp', 15),
('movement', 'Stretch During Handovers', 'When swapping seats with pupils, take an extra 30 seconds to stretch your legs.', 'Timer', 16),
('movement', 'Park and Walk', 'When possible, park a short walk from pickup points. Extra steps add up!', 'MapPin', 17),

-- Stress tips
('stress', '4-7-8 Breathing', 'Between pupils: inhale for 4 seconds, hold for 7, exhale for 8. Instant calm.', 'Wind', 18),
('stress', 'Positive Self-Talk', 'Replace "this pupil is difficult" with "this pupil is challenging me to teach better".', 'MessageCircle', 19),
('stress', 'Music Reset', 'Between lessons, play one song you love. A 3-minute mental reset works wonders.', 'Music', 20),
('stress', 'Celebrate Small Wins', 'Mentally note one thing each pupil did well today. Ends lessons on a positive note.', 'Award', 21),

-- Nutrition tips
('nutrition', 'Pack Healthy Snacks', 'Keep nuts, fruit, or energy bars in your glovebox. Avoid service station temptations.', 'Apple', 22),
('nutrition', 'Regular Meal Times', 'Try to eat at consistent times. Erratic eating affects energy and mood.', 'Clock', 23),
('nutrition', 'Light Lunch for Focus', 'Heavy lunches cause afternoon drowsiness. Opt for lighter, protein-rich meals.', 'Salad', 24),

-- Sleep tips
('sleep', 'Consistent Wake Time', 'Waking at the same time daily, even weekends, improves overall energy.', 'Sunrise', 25),
('sleep', 'Avoid Late Caffeine', 'Stop caffeine after 2pm for better sleep quality that night.', 'Coffee', 26),
('sleep', 'Wind Down Routine', 'Create a 30-minute pre-sleep routine. Your body will learn it is time to rest.', 'Moon', 27);