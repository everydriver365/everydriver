ALTER TABLE public.instructors ADD COLUMN sidebar_pinned JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.instructors.sidebar_pinned IS 'Ordered list of pinned sidebar route paths for the instructor desktop';