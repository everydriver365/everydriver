-- Instructor App Hero Content
CREATE TABLE public.instructor_app_hero (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_text text NOT NULL DEFAULT 'Trusted by 500+ driving instructors',
  headline_part1 text NOT NULL DEFAULT 'Grow Your Driving School',
  headline_highlight text NOT NULL DEFAULT 'Business',
  subtext text NOT NULL DEFAULT 'The all-in-one platform for driving instructors. Manage your diary, pupils, payments, and get your own website — all from one simple dashboard.',
  primary_cta_text text NOT NULL DEFAULT 'Start Free Trial',
  primary_cta_link text NOT NULL DEFAULT '/instructor-app/signup',
  secondary_cta_text text NOT NULL DEFAULT 'View Pricing',
  secondary_cta_link text NOT NULL DEFAULT '/instructor-app/pricing',
  demo_cta_text text NOT NULL DEFAULT 'See Demo',
  demo_cta_link text NOT NULL DEFAULT '/i/sarah-mitchell',
  trust_badge1 text NOT NULL DEFAULT 'No credit card required',
  trust_badge2 text NOT NULL DEFAULT 'Free plan available',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Instructor App Features
CREATE TABLE public.instructor_app_features (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  icon_name text NOT NULL DEFAULT 'Calendar',
  title text NOT NULL,
  description text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Instructor App Testimonials
CREATE TABLE public.instructor_app_testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  photo_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Instructor App Sections (for section titles)
CREATE TABLE public.instructor_app_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text NOT NULL UNIQUE,
  section_name text NOT NULL,
  title text NOT NULL,
  subtitle text,
  is_visible boolean DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instructor_app_hero ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_app_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_app_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_app_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Public read, admin write
CREATE POLICY "Instructor app hero is publicly viewable" ON public.instructor_app_hero FOR SELECT USING (true);
CREATE POLICY "Admins can manage instructor app hero" ON public.instructor_app_hero FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Instructor app features are publicly viewable" ON public.instructor_app_features FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage instructor app features" ON public.instructor_app_features FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Instructor app testimonials are publicly viewable" ON public.instructor_app_testimonials FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage instructor app testimonials" ON public.instructor_app_testimonials FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Instructor app sections are publicly viewable" ON public.instructor_app_sections FOR SELECT USING (true);
CREATE POLICY "Admins can manage instructor app sections" ON public.instructor_app_sections FOR ALL USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_instructor_app_hero_updated_at BEFORE UPDATE ON public.instructor_app_hero FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_instructor_app_features_updated_at BEFORE UPDATE ON public.instructor_app_features FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_instructor_app_testimonials_updated_at BEFORE UPDATE ON public.instructor_app_testimonials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_instructor_app_sections_updated_at BEFORE UPDATE ON public.instructor_app_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default hero content
INSERT INTO public.instructor_app_hero (id) VALUES (gen_random_uuid());

-- Insert default features
INSERT INTO public.instructor_app_features (icon_name, title, description, display_order) VALUES
('Calendar', 'Smart Diary', 'Manage your schedule with ease. Sync with Google Calendar and never double-book again.', 1),
('Users', 'Pupil Management', 'Track student progress, lesson history, and manage all your learners in one place.', 2),
('CreditCard', 'Payment Tracking', 'Send payment requests, track outstanding balances, and get paid faster.', 3),
('Globe', 'Mini Website', 'Get your own branded website automatically. Pupils can book and pay online.', 4),
('BarChart3', 'Business Insights', 'Track your earnings, expenses, and see how your business is growing.', 5),
('MessageSquare', 'SMS Notifications', 'Send automated reminders and fill gaps with discounted lessons.', 6);

-- Insert default testimonials
INSERT INTO public.instructor_app_testimonials (name, role, content, rating, display_order) VALUES
('Sarah Mitchell', 'ADI, Manchester', 'InstructorPro has transformed how I run my business. The diary alone saves me hours every week!', 5, 1),
('James Cooper', 'ADI, Birmingham', 'My pupils love the mini-website. It''s so professional and booking is a breeze.', 5, 2),
('Emily Watson', 'PDI, London', 'The payment tracking feature means I finally know exactly who owes what. Game changer!', 5, 3);

-- Insert default sections
INSERT INTO public.instructor_app_sections (section_key, section_name, title, subtitle, display_order) VALUES
('features', 'Features Section', 'Everything You Need to Succeed', 'From managing your diary to getting paid, we''ve got you covered.', 1),
('testimonials', 'Testimonials Section', 'Loved by Instructors', 'See what other driving instructors are saying about InstructorPro.', 2),
('cta', 'Call to Action', 'Ready to Grow Your Business?', 'Join hundreds of driving instructors who trust InstructorPro to manage their business.', 3);