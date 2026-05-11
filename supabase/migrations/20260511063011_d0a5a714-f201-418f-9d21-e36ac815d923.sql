
-- 1) Extend instructor_website_pages with SEO + draft fields
ALTER TABLE public.instructor_website_pages
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS keywords text,
  ADD COLUMN IF NOT EXISTS schema_jsonld jsonb,
  ADD COLUMN IF NOT EXISTS last_edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_edited_by uuid,
  ADD COLUMN IF NOT EXISTS draft_content_blocks jsonb,
  ADD COLUMN IF NOT EXISTS has_unpublished_changes boolean NOT NULL DEFAULT false;

-- 2) Site-wide settings table
CREATE TABLE IF NOT EXISTS public.instructor_website_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL UNIQUE REFERENCES public.instructors(id) ON DELETE CASCADE,
  site_tagline text,
  default_meta_description text,
  default_keywords text,
  default_og_image_url text,
  social_links jsonb DEFAULT '{}'::jsonb,
  google_analytics_id text,
  google_site_verification text,
  robots_indexable boolean NOT NULL DEFAULT true,
  custom_head_html text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_iws_instructor ON public.instructor_website_settings(instructor_id);

ALTER TABLE public.instructor_website_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view settings" ON public.instructor_website_settings;
CREATE POLICY "Public can view settings"
  ON public.instructor_website_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Instructors manage own settings" ON public.instructor_website_settings;
CREATE POLICY "Instructors manage own settings"
  ON public.instructor_website_settings
  FOR ALL
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "Admins manage all settings" ON public.instructor_website_settings;
CREATE POLICY "Admins manage all settings"
  ON public.instructor_website_settings
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_instructor_website_settings_updated_at
  BEFORE UPDATE ON public.instructor_website_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
