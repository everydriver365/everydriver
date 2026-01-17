-- Add hero_image_url column for instructor mini-website banner
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS hero_image_url TEXT;