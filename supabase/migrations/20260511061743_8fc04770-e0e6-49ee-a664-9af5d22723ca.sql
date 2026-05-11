
-- Phase 1.1: Scale indexes for branded site host resolution
CREATE UNIQUE INDEX IF NOT EXISTS idx_instructors_app_slug
  ON public.instructors (app_slug)
  WHERE app_slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_instructors_custom_domain_verified
  ON public.instructors (custom_domain)
  WHERE custom_domain IS NOT NULL AND custom_domain_verified = true;

CREATE INDEX IF NOT EXISTS idx_iwp_instructor_pagetype
  ON public.instructor_website_pages (instructor_id, page_type);

CREATE INDEX IF NOT EXISTS idx_iwp_instructor_published
  ON public.instructor_website_pages (instructor_id)
  WHERE is_published = true;

-- Phase 1.2: Backfill missing website pages so /i/{slug} never 404s
-- Inserts only the missing (instructor_id, page_type) rows, copying the
-- same default content the trigger uses for new signups.
WITH page_defaults (page_type, page_title, hero_heading_tpl, hero_subheading, display_order, content_blocks) AS (
  VALUES
    ('home','Home','Driving Lessons with %s','Professional driving instruction tailored to your needs',1,
      '[{"type":"text","title":"Why Choose Us","content":"With years of experience and a passion for teaching, I provide patient, professional driving instruction to help you pass your test with confidence."},{"type":"features","title":"What We Offer","items":["Free re-test if you fail","Earlier test date guaranteed","Flexible payments with Klarna & Clearpay","Free theory test access","Free cancellation finder","Modern dual-control vehicle"]}]'::jsonb),
    ('about','About','About %s','Get to know your instructor',2,
      '[{"type":"text","title":"My Background","content":"I am a qualified ADI with a commitment to providing excellent driving tuition. My goal is to help every student become a safe, confident driver for life."},{"type":"text","title":"Teaching Philosophy","content":"I believe in patient, encouraging instruction that builds confidence step by step."}]'::jsonb),
    ('services','Services','Our Services','Driving courses to suit every learner',3,
      '[{"type":"text","title":"Lesson Options","content":"Whether you prefer regular weekly lessons or an intensive course, I can create a learning plan that works for you."},{"type":"features","title":"Course Types","items":["Weekly lessons - learn at your own pace","Semi-intensive - pass in 2-4 weeks","Intensive courses - pass in 1-2 weeks","Test in a Week packages"]}]'::jsonb),
    ('reviews','Reviews','Student Reviews','See what my students say',4,
      '[{"type":"text","title":"Testimonials","content":"My students success is my greatest achievement. Read their stories below."}]'::jsonb),
    ('contact','Contact','Get in Touch','Ready to start your driving journey?',5,
      '[{"type":"text","title":"Book Your First Lesson","content":"Contact me today to discuss your learning needs and book your first lesson. I look forward to helping you achieve your driving goals!"}]'::jsonb)
)
INSERT INTO public.instructor_website_pages
  (instructor_id, page_type, page_title, hero_heading, hero_subheading, display_order, content_blocks)
SELECT
  i.id,
  d.page_type,
  d.page_title,
  format(d.hero_heading_tpl, COALESCE(NULLIF(trim(i.business_name),''), i.name, 'Your Instructor')),
  d.hero_subheading,
  d.display_order,
  d.content_blocks
FROM public.instructors i
CROSS JOIN page_defaults d
LEFT JOIN public.instructor_website_pages existing
  ON existing.instructor_id = i.id AND existing.page_type = d.page_type
WHERE existing.id IS NULL;

-- Phase 1.7: Health monitoring table
CREATE TABLE IF NOT EXISTS public.mini_site_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  slug_ok BOOLEAN NOT NULL DEFAULT false,
  pages_ok BOOLEAN NOT NULL DEFAULT false,
  pages_missing TEXT[] DEFAULT ARRAY[]::TEXT[],
  domain_ok BOOLEAN,
  dns_ok BOOLEAN,
  ssl_ok BOOLEAN,
  render_ok BOOLEAN,
  status TEXT NOT NULL DEFAULT 'unknown', -- 'green' | 'amber' | 'red' | 'unknown'
  notes TEXT,
  UNIQUE (instructor_id)
);

CREATE INDEX IF NOT EXISTS idx_mini_site_health_status
  ON public.mini_site_health (status);

ALTER TABLE public.mini_site_health ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all mini-site health" ON public.mini_site_health;
CREATE POLICY "Admins can view all mini-site health"
  ON public.mini_site_health FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Instructors can view their own mini-site health" ON public.mini_site_health;
CREATE POLICY "Instructors can view their own mini-site health"
  ON public.mini_site_health FOR SELECT
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));
