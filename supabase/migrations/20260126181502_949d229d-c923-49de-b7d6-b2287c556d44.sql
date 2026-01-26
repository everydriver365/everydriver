-- Create table for admin section notes/content blocks
CREATE TABLE public.admin_section_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  note_type TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_section_notes ENABLE ROW LEVEL SECURITY;

-- Allow public read for admin portal (admin auth is PIN-based, not RLS-based)
CREATE POLICY "Allow public read for admin section notes"
  ON public.admin_section_notes
  FOR SELECT
  USING (true);

-- Allow public insert/update/delete for admin portal
CREATE POLICY "Allow public insert for admin section notes"
  ON public.admin_section_notes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update for admin section notes"
  ON public.admin_section_notes
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete for admin section notes"
  ON public.admin_section_notes
  FOR DELETE
  USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_admin_section_notes_updated_at
  BEFORE UPDATE ON public.admin_section_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();