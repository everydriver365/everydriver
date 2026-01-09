-- Create promotional messages table for CMS
CREATE TABLE public.promotional_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  link_url TEXT,
  link_text TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotional_messages ENABLE ROW LEVEL SECURITY;

-- Allow public read access for active messages
CREATE POLICY "Anyone can view active promotional messages"
ON public.promotional_messages
FOR SELECT
USING (is_active = true);

-- Insert a default promotional message
INSERT INTO public.promotional_messages (message, link_url, link_text, is_active, display_order)
VALUES ('🎉 New Year Special: Get 10% off all intensive courses! Book before January 31st', '/courses', 'Book Now', true, 1);