
-- Add missing columns to course_enquiries
ALTER TABLE public.course_enquiries ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.course_enquiries ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.course_enquiries ADD COLUMN IF NOT EXISTS transmission_type text;
ALTER TABLE public.course_enquiries ADD COLUMN IF NOT EXISTS total_cost numeric;

-- Add transmission_type to pupils
ALTER TABLE public.pupils ADD COLUMN IF NOT EXISTS transmission_type text;
