-- Add category column to saved_routes table
ALTER TABLE public.saved_routes 
ADD COLUMN category TEXT DEFAULT 'general';

-- Add an index for faster category filtering
CREATE INDEX idx_saved_routes_category ON public.saved_routes(instructor_id, category);