-- Create table to store instructor tile order preferences
CREATE TABLE public.instructor_tile_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  tile_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT instructor_tile_preferences_instructor_id_key UNIQUE (instructor_id)
);

-- Create index for fast lookups
CREATE INDEX idx_instructor_tile_preferences_instructor_id ON public.instructor_tile_preferences(instructor_id);

-- Enable Row Level Security
ALTER TABLE public.instructor_tile_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using auth_user_id column
CREATE POLICY "Instructors can view their own tile preferences"
ON public.instructor_tile_preferences
FOR SELECT
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can insert their own tile preferences"
ON public.instructor_tile_preferences
FOR INSERT
WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update their own tile preferences"
ON public.instructor_tile_preferences
FOR UPDATE
USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_instructor_tile_preferences_updated_at
BEFORE UPDATE ON public.instructor_tile_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();