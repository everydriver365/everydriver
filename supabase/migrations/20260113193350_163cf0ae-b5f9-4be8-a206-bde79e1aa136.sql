-- Add discounted price and custom features to instructor_courses for per-instructor customization
ALTER TABLE public.instructor_courses
ADD COLUMN discounted_price numeric DEFAULT NULL,
ADD COLUMN custom_features text[] DEFAULT NULL;