-- Create table for instructor mini-website pages
CREATE TABLE public.instructor_website_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL CHECK (page_type IN ('home', 'about', 'services', 'reviews', 'contact')),
  page_title TEXT NOT NULL,
  hero_heading TEXT,
  hero_subheading TEXT,
  hero_image_url TEXT,
  content_blocks JSONB DEFAULT '[]'::jsonb,
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, page_type)
);

-- Enable RLS
ALTER TABLE public.instructor_website_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view published pages" 
ON public.instructor_website_pages 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Instructors can manage own pages" 
ON public.instructor_website_pages 
FOR ALL 
TO authenticated
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Admins can manage all pages" 
ON public.instructor_website_pages 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to generate default website pages for new instructors
CREATE OR REPLACE FUNCTION public.create_instructor_website_pages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert 5 default pages for the new instructor
  INSERT INTO public.instructor_website_pages (instructor_id, page_type, page_title, hero_heading, hero_subheading, display_order, content_blocks)
  VALUES
    (NEW.id, 'home', 'Home', 'Welcome to ' || NEW.name, 'Professional driving instruction tailored to your needs', 1, 
     '[{"type":"text","title":"Why Choose Us","content":"With years of experience and a passion for teaching, I provide patient, professional driving instruction to help you pass your test with confidence."},{"type":"features","title":"What We Offer","items":["Flexible scheduling","Patient instruction","Modern dual-control vehicle","Competitive rates"]}]'::jsonb),
    (NEW.id, 'about', 'About', 'About ' || NEW.name, 'Get to know your instructor', 2,
     '[{"type":"text","title":"My Background","content":"I am a qualified ADI with a commitment to providing excellent driving tuition. My goal is to help every student become a safe, confident driver for life."},{"type":"text","title":"Teaching Philosophy","content":"I believe in patient, encouraging instruction that builds confidence step by step."}]'::jsonb),
    (NEW.id, 'services', 'Services', 'Our Services', 'Driving courses to suit every learner', 3,
     '[{"type":"text","title":"Lesson Options","content":"Whether you prefer regular weekly lessons or an intensive course, I can create a learning plan that works for you."}]'::jsonb),
    (NEW.id, 'reviews', 'Reviews', 'Student Reviews', 'See what my students say', 4,
     '[{"type":"text","title":"Testimonials","content":"My students success is my greatest achievement. Read their stories below."}]'::jsonb),
    (NEW.id, 'contact', 'Contact', 'Get in Touch', 'Ready to start your driving journey?', 5,
     '[{"type":"text","title":"Book Your First Lesson","content":"Contact me today to discuss your learning needs and book your first lesson. I look forward to helping you achieve your driving goals!"}]'::jsonb);
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate pages on instructor creation
CREATE TRIGGER create_website_pages_on_instructor_insert
AFTER INSERT ON public.instructors
FOR EACH ROW
EXECUTE FUNCTION public.create_instructor_website_pages();

-- Create default pages for existing instructors
INSERT INTO public.instructor_website_pages (instructor_id, page_type, page_title, hero_heading, hero_subheading, display_order, content_blocks)
SELECT 
  i.id,
  p.page_type,
  p.page_title,
  CASE 
    WHEN p.page_type = 'home' THEN 'Welcome to ' || i.name
    WHEN p.page_type = 'about' THEN 'About ' || i.name
    ELSE p.hero_heading
  END,
  p.hero_subheading,
  p.display_order,
  p.content_blocks
FROM public.instructors i
CROSS JOIN (
  VALUES 
    ('home', 'Home', 'Welcome', 'Professional driving instruction tailored to your needs', 1, '[{"type":"text","title":"Why Choose Us","content":"With years of experience and a passion for teaching, I provide patient, professional driving instruction to help you pass your test with confidence."}]'::jsonb),
    ('about', 'About', 'About', 'Get to know your instructor', 2, '[{"type":"text","title":"My Background","content":"I am a qualified ADI with a commitment to providing excellent driving tuition."}]'::jsonb),
    ('services', 'Services', 'Our Services', 'Driving courses to suit every learner', 3, '[{"type":"text","title":"Lesson Options","content":"Whether you prefer regular weekly lessons or an intensive course, I can create a learning plan that works for you."}]'::jsonb),
    ('reviews', 'Reviews', 'Student Reviews', 'See what my students say', 4, '[{"type":"text","title":"Testimonials","content":"My students success is my greatest achievement."}]'::jsonb),
    ('contact', 'Contact', 'Get in Touch', 'Ready to start your driving journey?', 5, '[{"type":"text","title":"Book Your First Lesson","content":"Contact me today to book your first lesson."}]'::jsonb)
) AS p(page_type, page_title, hero_heading, hero_subheading, display_order, content_blocks)
WHERE NOT EXISTS (
  SELECT 1 FROM public.instructor_website_pages wp 
  WHERE wp.instructor_id = i.id AND wp.page_type = p.page_type
);

-- Add trigger for updated_at
CREATE TRIGGER update_instructor_website_pages_updated_at
BEFORE UPDATE ON public.instructor_website_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();