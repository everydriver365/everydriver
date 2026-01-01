-- Add buffer_minutes column to instructors
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER NOT NULL DEFAULT 15;

-- Create instructor working hours table
CREATE TABLE public.instructor_working_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.instructor_working_hours ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (matching instructor table)
CREATE POLICY "Working hours are publicly viewable" 
ON public.instructor_working_hours 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert working hours" 
ON public.instructor_working_hours 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update working hours" 
ON public.instructor_working_hours 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete working hours" 
ON public.instructor_working_hours 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_instructor_working_hours_updated_at
BEFORE UPDATE ON public.instructor_working_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create date-specific overrides table (for specific dates with different hours)
CREATE TABLE public.instructor_date_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  start_time TIME, -- null means unavailable
  end_time TIME,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, override_date)
);

-- Enable RLS
ALTER TABLE public.instructor_date_overrides ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
CREATE POLICY "Date overrides are publicly viewable" 
ON public.instructor_date_overrides 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert date overrides" 
ON public.instructor_date_overrides 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update date overrides" 
ON public.instructor_date_overrides 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete date overrides" 
ON public.instructor_date_overrides 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_instructor_date_overrides_updated_at
BEFORE UPDATE ON public.instructor_date_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();