
-- Fix the security definer view issue
DROP VIEW IF EXISTS public.public_schools;
CREATE VIEW public.public_schools
  WITH (security_invoker = true)
AS
SELECT id, name, slug, description, logo_url, brand_colour
FROM public.schools
WHERE slug IS NOT NULL;
