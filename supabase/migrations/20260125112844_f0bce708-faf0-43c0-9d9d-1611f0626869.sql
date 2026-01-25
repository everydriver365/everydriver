-- Create admin_websites_needed table for editable websites list
CREATE TABLE public.admin_websites_needed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_websites_needed ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view websites needed"
ON public.admin_websites_needed FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert websites needed"
ON public.admin_websites_needed FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update websites needed"
ON public.admin_websites_needed FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete websites needed"
ON public.admin_websites_needed FOR DELETE
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_websites_needed_updated_at
BEFORE UPDATE ON public.admin_websites_needed
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_websites_needed;