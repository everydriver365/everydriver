-- Function to slugify a name into a unique app_slug
CREATE OR REPLACE FUNCTION public.generate_unique_instructor_slug(p_source TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  suffix INT := 1;
BEGIN
  -- Slugify: lowercase, strip non-alnum to dashes, collapse, trim
  base_slug := lower(regexp_replace(coalesce(p_source, ''), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'instructor';
  END IF;
  candidate := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.instructors WHERE app_slug = candidate) LOOP
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix;
  END LOOP;
  RETURN candidate;
END;
$$;

-- BEFORE INSERT trigger: ensure app_slug is populated
CREATE OR REPLACE FUNCTION public.set_instructor_app_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.app_slug IS NULL OR trim(NEW.app_slug) = '' THEN
    NEW.app_slug := public.generate_unique_instructor_slug(
      coalesce(nullif(trim(NEW.business_name), ''), NEW.name)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_instructor_app_slug_before_insert ON public.instructors;
CREATE TRIGGER set_instructor_app_slug_before_insert
BEFORE INSERT ON public.instructors
FOR EACH ROW
EXECUTE FUNCTION public.set_instructor_app_slug();

-- Backfill any existing rows missing app_slug
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id, name, business_name FROM public.instructors WHERE app_slug IS NULL OR trim(app_slug) = '' LOOP
    UPDATE public.instructors
       SET app_slug = public.generate_unique_instructor_slug(coalesce(nullif(trim(r.business_name), ''), r.name))
     WHERE id = r.id;
  END LOOP;
END $$;

-- Add a unique index so app_slug collisions are impossible
CREATE UNIQUE INDEX IF NOT EXISTS instructors_app_slug_unique ON public.instructors (app_slug) WHERE app_slug IS NOT NULL;