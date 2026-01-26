-- Create table for demo mini website content
CREATE TABLE public.demo_mini_website (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type TEXT NOT NULL CHECK (page_type IN ('home', 'about', 'services', 'reviews', 'contact')),
  page_title TEXT NOT NULL,
  hero_heading TEXT,
  hero_subheading TEXT,
  hero_image_url TEXT,
  content_blocks JSONB DEFAULT '[]'::jsonb,
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_type)
);

-- Enable RLS
ALTER TABLE public.demo_mini_website ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for displaying the demo)
CREATE POLICY "Anyone can view demo website pages"
ON public.demo_mini_website
FOR SELECT
USING (true);

-- Allow admins to manage demo website (using has_role function)
CREATE POLICY "Admins can manage demo website"
ON public.demo_mini_website
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default demo pages
INSERT INTO public.demo_mini_website (page_type, page_title, hero_heading, hero_subheading, display_order, content_blocks)
VALUES
  ('home', 'Home', 'Welcome to Demo Driving School', 'Professional driving instruction tailored to your needs', 1, 
   '[{"type":"text","title":"Why Choose Us","content":"With years of experience and a passion for teaching, we provide patient, professional driving instruction to help you pass your test with confidence."},{"type":"features","title":"What We Offer","items":["Flexible scheduling to fit your lifestyle","Patient, encouraging instruction","Modern dual-control vehicle","Competitive rates"]}]'::jsonb),
  ('about', 'About', 'About Demo Driving School', 'Get to know your instructor', 2,
   '[{"type":"text","title":"My Background","content":"I am a qualified ADI with a commitment to providing excellent driving tuition. My goal is to help every student become a safe, confident driver for life."},{"type":"text","title":"Teaching Philosophy","content":"I believe in patient, encouraging instruction that builds confidence step by step. Every learner is different, and I tailor my approach to suit your individual needs."}]'::jsonb),
  ('services', 'Services', 'Our Services', 'Driving courses to suit every learner', 3,
   '[{"type":"text","title":"Lesson Options","content":"Whether you prefer regular weekly lessons or an intensive course, we can create a learning plan that works for you."},{"type":"features","title":"Available Courses","items":["Hourly lessons - £35/hour","10-hour block - £320 (save £30)","20-hour block - £600 (save £100)","Intensive course - contact for details"]}]'::jsonb),
  ('reviews', 'Reviews', 'Student Reviews', 'See what our students say', 4,
   '[{"type":"text","title":"Testimonials","content":"Our students success is our greatest achievement. Read their stories below."}]'::jsonb),
  ('contact', 'Contact', 'Get in Touch', 'Ready to start your driving journey?', 5,
   '[{"type":"text","title":"Book Your First Lesson","content":"Contact us today to discuss your learning needs and book your first lesson. We look forward to helping you achieve your driving goals!"},{"type":"features","title":"Contact Details","items":["Phone: 07700 900123","Email: demo@drivingschool.com","Coverage: London and surrounding areas"]}]'::jsonb);

-- Create trigger for updated_at
CREATE TRIGGER update_demo_mini_website_updated_at
BEFORE UPDATE ON public.demo_mini_website
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();