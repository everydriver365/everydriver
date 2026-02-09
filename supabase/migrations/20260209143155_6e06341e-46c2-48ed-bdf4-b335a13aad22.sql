
-- Create instructor_resources table for documents and reference materials
CREATE TABLE public.instructor_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes BIGINT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instructor_resources ENABLE ROW LEVEL SECURITY;

-- Instructors can manage their own resources
CREATE POLICY "Instructors can view their own resources"
  ON public.instructor_resources FOR SELECT
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can insert their own resources"
  ON public.instructor_resources FOR INSERT
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can update their own resources"
  ON public.instructor_resources FOR UPDATE
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can delete their own resources"
  ON public.instructor_resources FOR DELETE
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Timestamp trigger
CREATE TRIGGER update_instructor_resources_updated_at
  BEFORE UPDATE ON public.instructor_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for instructor resource files
INSERT INTO storage.buckets (id, name, public) VALUES ('instructor-resources', 'instructor-resources', false);

-- Storage policies
CREATE POLICY "Instructors can upload their own resources"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'instructor-resources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Instructors can view their own resources"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'instructor-resources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Instructors can delete their own resources"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'instructor-resources' AND auth.uid()::text = (storage.foldername(name))[1]);
