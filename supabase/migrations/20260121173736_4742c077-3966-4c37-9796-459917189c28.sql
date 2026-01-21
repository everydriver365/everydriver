-- Create enquiry_notes table for tracking communication history
CREATE TABLE public.enquiry_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enquiry_id UUID NOT NULL REFERENCES public.course_enquiries(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.enquiry_notes ENABLE ROW LEVEL SECURITY;

-- Only admins can manage notes
CREATE POLICY "Admins can manage enquiry notes"
ON public.enquiry_notes FOR ALL
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create index for faster lookups
CREATE INDEX idx_enquiry_notes_enquiry_id ON public.enquiry_notes(enquiry_id);

-- Add admin_emails column to site_settings for notifications
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS admin_notification_emails TEXT[];