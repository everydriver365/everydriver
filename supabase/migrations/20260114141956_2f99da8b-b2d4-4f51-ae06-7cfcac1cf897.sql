-- Drop existing policies that incorrectly compare instructor_id to auth.uid()
DROP POLICY IF EXISTS "Instructors can view their own telematics" ON public.lesson_telematics;
DROP POLICY IF EXISTS "Instructors can insert their own telematics" ON public.lesson_telematics;
DROP POLICY IF EXISTS "Instructors can update their own telematics" ON public.lesson_telematics;
DROP POLICY IF EXISTS "Instructors can view GPS points for their telematics" ON public.telematics_gps_points;
DROP POLICY IF EXISTS "Instructors can insert GPS points for their telematics" ON public.telematics_gps_points;
DROP POLICY IF EXISTS "Instructors can view their behavior events" ON public.driving_behavior_events;
DROP POLICY IF EXISTS "Instructors can insert behavior events" ON public.driving_behavior_events;

-- Create corrected policies that properly link instructor_id via instructors.auth_user_id

-- lesson_telematics policies
CREATE POLICY "Instructors can view their own telematics" 
ON public.lesson_telematics 
FOR SELECT 
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can insert their own telematics" 
ON public.lesson_telematics 
FOR INSERT 
WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update their own telematics" 
ON public.lesson_telematics 
FOR UPDATE 
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- telematics_gps_points policies
CREATE POLICY "Instructors can view GPS points for their telematics" 
ON public.telematics_gps_points 
FOR SELECT 
USING (telematics_id IN (
  SELECT lt.id FROM public.lesson_telematics lt 
  JOIN public.instructors i ON lt.instructor_id = i.id 
  WHERE i.auth_user_id = auth.uid()
));

CREATE POLICY "Instructors can insert GPS points for their telematics" 
ON public.telematics_gps_points 
FOR INSERT 
WITH CHECK (telematics_id IN (
  SELECT lt.id FROM public.lesson_telematics lt 
  JOIN public.instructors i ON lt.instructor_id = i.id 
  WHERE i.auth_user_id = auth.uid()
));

-- driving_behavior_events policies
CREATE POLICY "Instructors can view their behavior events" 
ON public.driving_behavior_events 
FOR SELECT 
USING (telematics_id IN (
  SELECT lt.id FROM public.lesson_telematics lt 
  JOIN public.instructors i ON lt.instructor_id = i.id 
  WHERE i.auth_user_id = auth.uid()
));

CREATE POLICY "Instructors can insert behavior events" 
ON public.driving_behavior_events 
FOR INSERT 
WITH CHECK (telematics_id IN (
  SELECT lt.id FROM public.lesson_telematics lt 
  JOIN public.instructors i ON lt.instructor_id = i.id 
  WHERE i.auth_user_id = auth.uid()
));