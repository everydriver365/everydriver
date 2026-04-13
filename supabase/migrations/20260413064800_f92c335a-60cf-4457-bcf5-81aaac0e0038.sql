
CREATE TABLE public.booking_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  page_type TEXT NOT NULL DEFAULT 'instructor',
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  heading TEXT,
  description TEXT,
  logo_url TEXT,
  brand_colour TEXT DEFAULT '#1a1a2e',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_pages ENABLE ROW LEVEL SECURITY;

-- Public can read active booking pages
CREATE POLICY "Anyone can view active booking pages"
  ON public.booking_pages FOR SELECT
  USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can insert booking pages"
  ON public.booking_pages FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update booking pages"
  ON public.booking_pages FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete booking pages"
  ON public.booking_pages FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update timestamp
CREATE TRIGGER update_booking_pages_updated_at
  BEFORE UPDATE ON public.booking_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
