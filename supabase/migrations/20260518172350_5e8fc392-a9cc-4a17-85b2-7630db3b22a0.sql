ALTER TABLE public.instructors ADD COLUMN settings_sidebar_order JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.instructors.settings_sidebar_order IS 'Ordered list of settings sidebar section ids for this instructor';