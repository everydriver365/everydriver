-- Add new fields to course_templates for detailed content
ALTER TABLE public.course_templates
ADD COLUMN what_to_bring text[],
ADD COLUMN prerequisites text[],
ADD COLUMN theory_test_details text,
ADD COLUMN driving_test_details text,
ADD COLUMN payment_terms text,
ADD COLUMN terms_conditions text,
ADD COLUMN explainer_video_url text;

-- Add welcome video to instructors
ALTER TABLE public.instructors
ADD COLUMN welcome_video_url text;

-- Create reviews table
CREATE TABLE public.course_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  course_hours integer NOT NULL,
  reviewer_name text NOT NULL,
  review_text text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_date date DEFAULT CURRENT_DATE,
  is_verified boolean DEFAULT false,
  is_visible boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on reviews
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for reviews (public read, admin write)
CREATE POLICY "Reviews are publicly viewable"
ON public.course_reviews
FOR SELECT
USING (is_visible = true);

CREATE POLICY "Anyone can manage reviews"
ON public.course_reviews
FOR ALL
USING (true);