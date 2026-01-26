-- Add column to control logo visibility in hero section
ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS hero_show_logo BOOLEAN DEFAULT true;