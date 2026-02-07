
-- Create doodlepads table for map annotations
CREATE TABLE public.doodlepads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled',
  center_lat FLOAT8 NOT NULL DEFAULT 52.4862,
  center_lng FLOAT8 NOT NULL DEFAULT -1.8904,
  zoom_level INTEGER NOT NULL DEFAULT 16,
  annotations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doodlepads ENABLE ROW LEVEL SECURITY;

-- RLS policies - instructors can only access their own doodlepads
CREATE POLICY "Instructors can view their own doodlepads"
  ON public.doodlepads FOR SELECT
  USING (
    instructor_id IN (
      SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can create their own doodlepads"
  ON public.doodlepads FOR INSERT
  WITH CHECK (
    instructor_id IN (
      SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can update their own doodlepads"
  ON public.doodlepads FOR UPDATE
  USING (
    instructor_id IN (
      SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can delete their own doodlepads"
  ON public.doodlepads FOR DELETE
  USING (
    instructor_id IN (
      SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
    )
  );

-- Auto-update updated_at
CREATE TRIGGER update_doodlepads_updated_at
  BEFORE UPDATE ON public.doodlepads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_doodlepads_instructor_id ON public.doodlepads(instructor_id);
