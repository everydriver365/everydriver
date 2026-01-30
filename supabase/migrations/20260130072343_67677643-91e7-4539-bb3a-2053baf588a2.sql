-- Blood Pressure Readings
CREATE TABLE public.instructor_blood_pressure_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  log_time TIME DEFAULT CURRENT_TIME,
  systolic INTEGER NOT NULL CHECK (systolic > 0 AND systolic < 300),
  diastolic INTEGER NOT NULL CHECK (diastolic > 0 AND diastolic < 200),
  pulse INTEGER CHECK (pulse > 0 AND pulse < 250),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, log_date, log_time)
);

ALTER TABLE public.instructor_blood_pressure_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own BP logs"
  ON public.instructor_blood_pressure_logs
  FOR ALL
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()))
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Blood Glucose Readings
CREATE TABLE public.instructor_blood_glucose_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  log_time TIME DEFAULT CURRENT_TIME,
  reading_mmol DECIMAL(4,1) NOT NULL CHECK (reading_mmol > 0 AND reading_mmol < 35),
  reading_type TEXT NOT NULL DEFAULT 'fasting' CHECK (reading_type IN ('fasting', 'before_meal', 'after_meal', 'bedtime', 'random')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, log_date, log_time)
);

ALTER TABLE public.instructor_blood_glucose_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own glucose logs"
  ON public.instructor_blood_glucose_logs
  FOR ALL
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()))
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Support Resources/Documents
CREATE TABLE public.instructor_support_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('health', 'mental_health', 'nutrition', 'exercise', 'occupational', 'general')),
  resource_type TEXT NOT NULL DEFAULT 'article' CHECK (resource_type IN ('article', 'video', 'pdf', 'link', 'guide')),
  content TEXT,
  external_url TEXT,
  icon TEXT DEFAULT 'FileText',
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.instructor_support_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support resources are readable by authenticated users"
  ON public.instructor_support_resources
  FOR SELECT
  USING (is_active = true);

-- Forum Topics
CREATE TABLE public.instructor_forum_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('health', 'business', 'vehicles', 'students', 'general', 'tips')),
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP WITH TIME ZONE,
  last_reply_by UUID REFERENCES public.instructors(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.instructor_forum_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Forum topics are readable by all instructors"
  ON public.instructor_forum_topics
  FOR SELECT
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()) 
         OR EXISTS (SELECT 1 FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can create topics"
  ON public.instructor_forum_topics
  FOR INSERT
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update own topics"
  ON public.instructor_forum_topics
  FOR UPDATE
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Forum Replies
CREATE TABLE public.instructor_forum_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.instructor_forum_topics(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_solution BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.instructor_forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Forum replies are readable by all instructors"
  ON public.instructor_forum_replies
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can create replies"
  ON public.instructor_forum_replies
  FOR INSERT
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update own replies"
  ON public.instructor_forum_replies
  FOR UPDATE
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Forum Alerts (notifications for replies)
CREATE TABLE public.instructor_forum_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.instructor_forum_topics(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES public.instructor_forum_replies(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'reply' CHECK (alert_type IN ('reply', 'mention', 'solution')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.instructor_forum_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage own alerts"
  ON public.instructor_forum_alerts
  FOR ALL
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()))
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Trigger to update topic reply count and last_reply
CREATE OR REPLACE FUNCTION public.update_forum_topic_on_reply()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.instructor_forum_topics
    SET reply_count = reply_count + 1,
        last_reply_at = NEW.created_at,
        last_reply_by = NEW.instructor_id,
        updated_at = now()
    WHERE id = NEW.topic_id;
    
    -- Create alert for topic owner (if not replying to own topic)
    INSERT INTO public.instructor_forum_alerts (instructor_id, topic_id, reply_id, alert_type)
    SELECT t.instructor_id, NEW.topic_id, NEW.id, 'reply'
    FROM public.instructor_forum_topics t
    WHERE t.id = NEW.topic_id AND t.instructor_id != NEW.instructor_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.instructor_forum_topics
    SET reply_count = GREATEST(0, reply_count - 1),
        updated_at = now()
    WHERE id = OLD.topic_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_forum_reply_change
AFTER INSERT OR DELETE ON public.instructor_forum_replies
FOR EACH ROW EXECUTE FUNCTION public.update_forum_topic_on_reply();

-- Enable realtime for forum alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.instructor_forum_alerts;

-- Indexes for performance
CREATE INDEX idx_bp_logs_instructor_date ON public.instructor_blood_pressure_logs(instructor_id, log_date DESC);
CREATE INDEX idx_glucose_logs_instructor_date ON public.instructor_blood_glucose_logs(instructor_id, log_date DESC);
CREATE INDEX idx_forum_topics_category ON public.instructor_forum_topics(category, created_at DESC);
CREATE INDEX idx_forum_replies_topic ON public.instructor_forum_replies(topic_id, created_at);
CREATE INDEX idx_forum_alerts_instructor ON public.instructor_forum_alerts(instructor_id, is_read, created_at DESC);

-- Insert some initial support resources
INSERT INTO public.instructor_support_resources (title, description, category, resource_type, content, icon, display_order, is_featured) VALUES
('Managing Back Pain as an ADI', 'Essential tips for preventing and managing back pain while spending long hours in the car', 'health', 'article', 'As a driving instructor, you spend countless hours seated in a car. Here are key strategies to protect your back:\n\n1. **Adjust Your Seat Properly** - Ensure proper lumbar support and seat height\n2. **Take Regular Breaks** - Every 2-3 hours, get out and stretch\n3. **Core Strengthening** - Simple exercises can prevent pain\n4. **Use a Lumbar Support Cushion** - Invest in quality support\n5. **Stay Hydrated** - Dehydration can worsen muscle tension', 'Activity', 1, true),
('Eye Health for Instructors', 'Protecting your vision with long hours of focused driving', 'health', 'article', 'Your eyes work hard during lessons. Protect them with these tips:\n\n1. **Follow the 20-20-20 Rule** - Every 20 minutes, look at something 20 feet away for 20 seconds\n2. **Quality Sunglasses** - Invest in polarized lenses\n3. **Regular Eye Exams** - Annual checkups are essential\n4. **Blink More Often** - Conscious blinking reduces eye strain\n5. **Keep Hydrated** - Water helps maintain eye moisture', 'Eye', 2, true),
('Stress Management Techniques', 'Quick stress relief methods for between lessons', 'mental_health', 'article', 'Teaching to drive can be stressful. Try these quick techniques:\n\n1. **Box Breathing** - Inhale 4s, hold 4s, exhale 4s, hold 4s\n2. **Progressive Muscle Relaxation** - Tense and release muscle groups\n3. **Mindful Moments** - Take 60 seconds of quiet focus between lessons\n4. **Positive Affirmations** - Remind yourself of successful lessons\n5. **Physical Activity** - Even a short walk helps reset your mind', 'Brain', 3, false),
('Healthy Eating on the Road', 'Nutrition tips for instructors with irregular schedules', 'nutrition', 'guide', 'Eating well while working irregular hours:\n\n1. **Meal Prep** - Prepare healthy lunches in advance\n2. **Healthy Snacks** - Nuts, fruit, and vegetables over crisps\n3. **Stay Hydrated** - Keep water in the car\n4. **Avoid Sugar Crashes** - Choose complex carbs over sugary snacks\n5. **Mindful Eating** - Take proper breaks for meals when possible', 'Apple', 4, false),
('DVSA Instructor Resources', 'Official guidance and support from the DVSA', 'occupational', 'link', NULL, 'ExternalLink', 5, false);