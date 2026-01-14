-- Add hero_image_url column to instructor_app_hero table
ALTER TABLE public.instructor_app_hero 
ADD COLUMN hero_image_url TEXT DEFAULT NULL;