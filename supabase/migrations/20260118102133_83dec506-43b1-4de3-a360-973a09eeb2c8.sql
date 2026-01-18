-- Create favourite_locations table for quick navigation
CREATE TABLE public.favourite_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('test_centre', 'school', 'pupil_home', 'meeting_point', 'other')),
  address TEXT,
  postcode TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add sharing columns to saved_routes
ALTER TABLE public.saved_routes 
ADD COLUMN is_shared BOOLEAN DEFAULT false,
ADD COLUMN share_code TEXT UNIQUE,
ADD COLUMN shared_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on favourite_locations
ALTER TABLE public.favourite_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies for favourite_locations
CREATE POLICY "Instructors can view their own favourite locations"
ON public.favourite_locations FOR SELECT
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can create their own favourite locations"
ON public.favourite_locations FOR INSERT
WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update their own favourite locations"
ON public.favourite_locations FOR UPDATE
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can delete their own favourite locations"
ON public.favourite_locations FOR DELETE
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Allow public viewing of shared routes
CREATE POLICY "Anyone can view shared routes"
ON public.saved_routes FOR SELECT
USING (is_shared = true);

-- Create indexes
CREATE INDEX idx_favourite_locations_instructor ON public.favourite_locations(instructor_id);
CREATE INDEX idx_favourite_locations_category ON public.favourite_locations(category);
CREATE INDEX idx_saved_routes_share_code ON public.saved_routes(share_code) WHERE share_code IS NOT NULL;