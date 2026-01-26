-- Add menu text color column to instructors table
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS website_menu_text_color TEXT;