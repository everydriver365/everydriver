-- Create mileage logs table for automatic GPS session logging with tax tagging
CREATE TABLE public.mileage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  telematics_id UUID REFERENCES public.lesson_telematics(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.instructor_vehicles(id) ON DELETE SET NULL,
  pupil_id UUID REFERENCES public.pupils(id) ON DELETE SET NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  distance_km NUMERIC(10,3) NOT NULL DEFAULT 0,
  trip_type TEXT NOT NULL DEFAULT 'business' CHECK (trip_type IN ('business', 'personal')),
  purpose TEXT,
  start_location TEXT,
  end_location TEXT,
  start_odometer_km NUMERIC(10,1),
  end_odometer_km NUMERIC(10,1),
  is_auto_logged BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mileage_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies using auth_user_id
CREATE POLICY "Instructors can view their own mileage logs"
ON public.mileage_logs FOR SELECT
USING (auth.uid() IN (SELECT auth_user_id FROM public.instructors WHERE id = instructor_id));

CREATE POLICY "Instructors can insert their own mileage logs"
ON public.mileage_logs FOR INSERT
WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM public.instructors WHERE id = instructor_id));

CREATE POLICY "Instructors can update their own mileage logs"
ON public.mileage_logs FOR UPDATE
USING (auth.uid() IN (SELECT auth_user_id FROM public.instructors WHERE id = instructor_id));

CREATE POLICY "Instructors can delete their own mileage logs"
ON public.mileage_logs FOR DELETE
USING (auth.uid() IN (SELECT auth_user_id FROM public.instructors WHERE id = instructor_id));

-- Trigger for updated_at
CREATE TRIGGER update_mileage_logs_updated_at
BEFORE UPDATE ON public.mileage_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_mileage_logs_instructor_date ON public.mileage_logs(instructor_id, log_date DESC);
CREATE INDEX idx_mileage_logs_trip_type ON public.mileage_logs(instructor_id, trip_type);

-- Function to auto-log mileage when telematics session ends
CREATE OR REPLACE FUNCTION public.auto_log_mileage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if session has distance and is being ended
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL AND NEW.total_distance_km > 0.1 THEN
    INSERT INTO public.mileage_logs (
      instructor_id,
      telematics_id,
      vehicle_id,
      pupil_id,
      log_date,
      distance_km,
      trip_type,
      purpose,
      is_auto_logged
    ) VALUES (
      NEW.instructor_id,
      NEW.id,
      NEW.vehicle_id,
      NEW.pupil_id,
      COALESCE(NEW.started_at::date, CURRENT_DATE),
      NEW.total_distance_km,
      CASE WHEN NEW.pupil_id IS NOT NULL THEN 'business' ELSE 'personal' END,
      CASE 
        WHEN NEW.pupil_id IS NOT NULL THEN 'Driving lesson'
        WHEN NEW.session_type = 'test_route' THEN 'Test route'
        WHEN NEW.session_type = 'driving_test' THEN 'Driving test'
        ELSE 'GPS tracked journey'
      END,
      true
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on lesson_telematics
CREATE TRIGGER trigger_auto_log_mileage
AFTER UPDATE ON public.lesson_telematics
FOR EACH ROW
EXECUTE FUNCTION public.auto_log_mileage();