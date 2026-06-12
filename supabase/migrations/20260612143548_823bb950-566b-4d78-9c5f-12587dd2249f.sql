
DROP POLICY IF EXISTS "Anyone can view active discount codes" ON public.discount_codes;
REVOKE SELECT ON public.discount_codes FROM anon;

REVOKE SELECT ON public.instructor_website_settings FROM anon;
GRANT SELECT (
  id,
  instructor_id,
  site_tagline,
  default_meta_description,
  default_keywords,
  default_og_image_url,
  social_links,
  google_analytics_id,
  google_site_verification,
  robots_indexable,
  created_at,
  updated_at
) ON public.instructor_website_settings TO anon;
