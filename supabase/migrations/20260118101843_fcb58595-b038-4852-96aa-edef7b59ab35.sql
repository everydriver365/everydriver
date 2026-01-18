-- Create saved_routes table for storing named routes
CREATE TABLE public.saved_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  telematics_id UUID REFERENCES public.lesson_telematics(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  route_type TEXT NOT NULL DEFAULT 'recorded' CHECK (route_type IN ('recorded', 'uploaded')),
  start_location TEXT,
  end_location TEXT,
  distance_km NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create saved_route_waypoints table for uploaded routes
CREATE TABLE public.saved_route_waypoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES public.saved_routes(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_route_waypoints ENABLE ROW LEVEL SECURITY;

-- RLS policies for saved_routes
CREATE POLICY "Instructors can view their own saved routes"
ON public.saved_routes FOR SELECT
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can create their own saved routes"
ON public.saved_routes FOR INSERT
WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update their own saved routes"
ON public.saved_routes FOR UPDATE
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can delete their own saved routes"
ON public.saved_routes FOR DELETE
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- RLS policies for saved_route_waypoints (access via route ownership)
CREATE POLICY "Instructors can view waypoints of their routes"
ON public.saved_route_waypoints FOR SELECT
USING (route_id IN (
  SELECT id FROM public.saved_routes 
  WHERE instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid())
));

CREATE POLICY "Instructors can create waypoints for their routes"
ON public.saved_route_waypoints FOR INSERT
WITH CHECK (route_id IN (
  SELECT id FROM public.saved_routes 
  WHERE instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid())
));

CREATE POLICY "Instructors can delete waypoints from their routes"
ON public.saved_route_waypoints FOR DELETE
USING (route_id IN (
  SELECT id FROM public.saved_routes 
  WHERE instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid())
));

-- Create indexes for performance
CREATE INDEX idx_saved_routes_instructor ON public.saved_routes(instructor_id);
CREATE INDEX idx_saved_routes_telematics ON public.saved_routes(telematics_id);
CREATE INDEX idx_saved_route_waypoints_route ON public.saved_route_waypoints(route_id);