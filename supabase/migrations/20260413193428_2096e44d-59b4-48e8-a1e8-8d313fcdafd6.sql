-- Website theme columns on schools
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS website_tier TEXT DEFAULT 'single_page',
  ADD COLUMN IF NOT EXISTS website_theme TEXT DEFAULT 'modern',
  ADD COLUMN IF NOT EXISTS website_font TEXT DEFAULT 'inter',
  ADD COLUMN IF NOT EXISTS website_header_style TEXT DEFAULT 'transparent',
  ADD COLUMN IF NOT EXISTS website_header_bg TEXT,
  ADD COLUMN IF NOT EXISTS website_footer_bg TEXT,
  ADD COLUMN IF NOT EXISTS website_button_color TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

-- School website pages
CREATE TABLE public.school_website_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  page_type TEXT NOT NULL,
  page_title TEXT NOT NULL,
  hero_heading TEXT,
  hero_subheading TEXT,
  content_blocks JSONB DEFAULT '[]',
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, page_type)
);

ALTER TABLE public.school_website_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published school pages"
  ON public.school_website_pages FOR SELECT USING (is_published = true);

CREATE POLICY "School owners manage own pages"
  ON public.school_website_pages FOR ALL TO authenticated
  USING (public.is_school_owner(school_id));

CREATE POLICY "Admins manage all school pages"
  ON public.school_website_pages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_school_website_pages_updated_at
  BEFORE UPDATE ON public.school_website_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate default pages on school creation
CREATE OR REPLACE FUNCTION public.create_school_website_pages()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.school_website_pages (school_id, page_type, page_title, hero_heading, hero_subheading, display_order, content_blocks)
  VALUES
    (NEW.id, 'home', 'Home',
     'Welcome to ' || NEW.name,
     'Professional driving instruction from qualified, caring instructors', 1,
     '[{"type":"text","title":"Why Choose Us","content":"Our team of experienced, qualified driving instructors are dedicated to helping you pass your test with confidence."},{"type":"features","title":"What We Offer","items":["Fully qualified ADI instructors","Modern dual-control vehicles","Flexible lesson times","Intensive and semi-intensive courses","Free theory test support","Earlier test date guarantee"]}]'::jsonb),
    (NEW.id, 'about', 'About Us',
     'About ' || NEW.name,
     'Learn more about our driving school', 2,
     '[{"type":"text","title":"Our Story","content":"We are a professional driving school committed to providing the highest standard of driving tuition. Our instructors are carefully selected for their expertise and teaching ability."},{"type":"text","title":"Our Mission","content":"To help every learner become a safe, confident driver for life through patient, professional instruction."}]'::jsonb),
    (NEW.id, 'instructors', 'Our Instructors',
     'Meet Our Instructors',
     'Experienced, qualified professionals ready to help you learn', 3,
     '[{"type":"text","title":"Our Team","content":"Browse our team of qualified driving instructors and find the perfect match for your learning needs."}]'::jsonb),
    (NEW.id, 'contact', 'Contact Us',
     'Get in Touch',
     'Ready to start your driving journey?', 4,
     '[{"type":"text","title":"Contact Us","content":"Get in touch today to book your first lesson or ask any questions about our courses."}]'::jsonb);
  RETURN NEW;
END;
$function$;

CREATE TRIGGER create_school_website_pages_trigger
  AFTER INSERT ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.create_school_website_pages();