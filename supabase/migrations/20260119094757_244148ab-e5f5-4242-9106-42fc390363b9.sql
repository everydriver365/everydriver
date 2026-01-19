-- Create instructor_calendar_shares table for public availability sharing
CREATE TABLE public.instructor_calendar_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE UNIQUE,
  share_token TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  show_lesson_details BOOLEAN NOT NULL DEFAULT false,
  show_blocks BOOLEAN NOT NULL DEFAULT false,
  show_external_events BOOLEAN NOT NULL DEFAULT true,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instructor_calendar_shares ENABLE ROW LEVEL SECURITY;

-- Instructors can manage their own share settings
CREATE POLICY "Instructors can view their own share settings"
ON public.instructor_calendar_shares
FOR SELECT
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Instructors can create their own share settings"
ON public.instructor_calendar_shares
FOR INSERT
WITH CHECK (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Instructors can update their own share settings"
ON public.instructor_calendar_shares
FOR UPDATE
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Instructors can delete their own share settings"
ON public.instructor_calendar_shares
FOR DELETE
USING (instructor_id IN (
  SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
));

-- Public read access for valid share tokens (for the public availability page)
CREATE POLICY "Public can view enabled shares by token"
ON public.instructor_calendar_shares
FOR SELECT
USING (is_enabled = true);

-- Create trigger for updated_at
CREATE TRIGGER update_instructor_calendar_shares_updated_at
BEFORE UPDATE ON public.instructor_calendar_shares
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for token lookups
CREATE INDEX idx_instructor_calendar_shares_token ON public.instructor_calendar_shares(share_token);

-- Function to generate a unique share token
CREATE OR REPLACE FUNCTION public.generate_calendar_share_token()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  chars TEXT := 'abcdefghjkmnpqrstuvwxyz23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$function$;