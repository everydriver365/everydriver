-- Create course enquiries table for bespoke course requests
CREATE TABLE public.course_enquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  course_type TEXT NOT NULL,
  preferred_timing TEXT NOT NULL,
  additional_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_instructor_id UUID REFERENCES public.instructors(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pupils table for accepted enquiries
CREATE TABLE public.pupils (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  course_type TEXT,
  lessons_completed INTEGER DEFAULT 0,
  next_lesson TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0,
  notes TEXT,
  enquiry_id UUID REFERENCES public.course_enquiries(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pupils ENABLE ROW LEVEL SECURITY;

-- RLS policies for course_enquiries (public can create, instructors can view/update)
CREATE POLICY "Anyone can create course enquiries"
ON public.course_enquiries
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Course enquiries are publicly viewable"
ON public.course_enquiries
FOR SELECT
USING (true);

CREATE POLICY "Anyone can update course enquiries"
ON public.course_enquiries
FOR UPDATE
USING (true);

-- RLS policies for pupils
CREATE POLICY "Anyone can manage pupils"
ON public.course_enquiries
FOR ALL
USING (true);

CREATE POLICY "Pupils are publicly viewable"
ON public.pupils
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert pupils"
ON public.pupils
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update pupils"
ON public.pupils
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete pupils"
ON public.pupils
FOR DELETE
USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_course_enquiries_updated_at
BEFORE UPDATE ON public.course_enquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pupils_updated_at
BEFORE UPDATE ON public.pupils
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();