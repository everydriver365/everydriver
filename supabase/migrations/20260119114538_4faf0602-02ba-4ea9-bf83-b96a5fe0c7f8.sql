-- Create instructor_terms_conditions table
CREATE TABLE public.instructor_terms_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Terms & Conditions',
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pupil_signatures table
CREATE TABLE public.pupil_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  terms_id UUID NOT NULL REFERENCES public.instructor_terms_conditions(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  signature_url TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instructor_terms_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pupil_signatures ENABLE ROW LEVEL SECURITY;

-- RLS policies for instructor_terms_conditions
CREATE POLICY "Instructors can view their own terms"
  ON public.instructor_terms_conditions
  FOR SELECT
  USING (instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Instructors can create their own terms"
  ON public.instructor_terms_conditions
  FOR INSERT
  WITH CHECK (instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Instructors can update their own terms"
  ON public.instructor_terms_conditions
  FOR UPDATE
  USING (instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Instructors can delete their own terms"
  ON public.instructor_terms_conditions
  FOR DELETE
  USING (instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ));

-- RLS policies for pupil_signatures
CREATE POLICY "Instructors can view signatures for their pupils"
  ON public.pupil_signatures
  FOR SELECT
  USING (instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Instructors can create signatures"
  ON public.pupil_signatures
  FOR INSERT
  WITH CHECK (instructor_id IN (
    SELECT id FROM instructors WHERE auth_user_id = auth.uid()
  ));

-- Signatures are immutable - no update or delete policies

-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for signatures bucket
CREATE POLICY "Instructors can upload signatures"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'signatures' AND auth.uid() IS NOT NULL);

CREATE POLICY "Instructors can view their signatures"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'signatures' AND auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_instructor_terms_instructor_id ON public.instructor_terms_conditions(instructor_id);
CREATE INDEX idx_instructor_terms_is_active ON public.instructor_terms_conditions(is_active);
CREATE INDEX idx_pupil_signatures_pupil_id ON public.pupil_signatures(pupil_id);
CREATE INDEX idx_pupil_signatures_terms_id ON public.pupil_signatures(terms_id);

-- Add updated_at trigger for terms
CREATE TRIGGER update_instructor_terms_conditions_updated_at
  BEFORE UPDATE ON public.instructor_terms_conditions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();