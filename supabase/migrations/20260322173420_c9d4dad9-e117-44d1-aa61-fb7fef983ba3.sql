
ALTER TABLE public.instructor_subscriptions ADD COLUMN IF NOT EXISTS is_pdi_programme boolean DEFAULT false;
ALTER TABLE public.instructor_subscriptions ADD COLUMN IF NOT EXISTS qualification_converted_at timestamptz;
