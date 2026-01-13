-- Add secondary promo banners column for instructor homepage
ALTER TABLE public.instructor_homepage_content 
ADD COLUMN secondary_promo_banners JSONB DEFAULT '[]'::jsonb;