
-- Create instructor premium placements table
CREATE TABLE public.instructor_premium_placements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  placement_type TEXT NOT NULL DEFAULT 'featured',
  priority_score INTEGER NOT NULL DEFAULT 10,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(instructor_id)
);

-- Enable RLS
ALTER TABLE public.instructor_premium_placements ENABLE ROW LEVEL SECURITY;

-- Public read access (learners need to see premium status)
CREATE POLICY "Anyone can view active premium placements"
ON public.instructor_premium_placements
FOR SELECT
USING (true);

-- Instructors can update their own placement
CREATE POLICY "Instructors can update own placement"
ON public.instructor_premium_placements
FOR UPDATE
TO authenticated
USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Admins can insert/update/delete any placement
CREATE POLICY "Admins can manage all placements"
ON public.instructor_premium_placements
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER set_updated_at_premium_placements
BEFORE UPDATE ON public.instructor_premium_placements
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
