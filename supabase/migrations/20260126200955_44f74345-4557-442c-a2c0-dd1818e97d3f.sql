-- Add hero overlay color column to instructors table
ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS hero_overlay_color TEXT DEFAULT '#000000';

-- Add hero overlay opacity column
ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS hero_overlay_opacity NUMERIC DEFAULT 0.2;