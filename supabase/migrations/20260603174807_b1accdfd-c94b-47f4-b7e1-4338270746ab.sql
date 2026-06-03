
CREATE TABLE public.booking_page_instructors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_page_id uuid NOT NULL REFERENCES public.booking_pages(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_page_id, instructor_id)
);

CREATE INDEX booking_page_instructors_page_idx ON public.booking_page_instructors(booking_page_id);

GRANT SELECT ON public.booking_page_instructors TO anon;
GRANT SELECT ON public.booking_page_instructors TO authenticated;
GRANT ALL ON public.booking_page_instructors TO service_role;

ALTER TABLE public.booking_page_instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read instructors for active booking pages"
ON public.booking_page_instructors
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.booking_pages bp
    WHERE bp.id = booking_page_instructors.booking_page_id
      AND bp.is_active = true
  )
);

CREATE POLICY "Admins can manage booking page instructors"
ON public.booking_page_instructors
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
