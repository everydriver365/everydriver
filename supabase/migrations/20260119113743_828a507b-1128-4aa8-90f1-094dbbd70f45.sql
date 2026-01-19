-- Create instructor FAQs table
CREATE TABLE public.instructor_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instructor_faqs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read published FAQs (instructors don't need to be logged in to view help)
CREATE POLICY "Anyone can view published FAQs"
ON public.instructor_faqs
FOR SELECT
USING (is_published = true);

-- Allow admins to manage FAQs
CREATE POLICY "Admins can manage FAQs"
ON public.instructor_faqs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_instructor_faqs_updated_at
BEFORE UPDATE ON public.instructor_faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();