
CREATE TABLE IF NOT EXISTS public.instructor_discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 10,
  applies_to text DEFAULT 'all',
  min_purchase_amount numeric DEFAULT 0,
  max_uses integer,
  times_used integer DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(instructor_id, code)
);

ALTER TABLE public.instructor_discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own discount codes"
  ON public.instructor_discount_codes FOR ALL
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Admins can view all discount codes"
  ON public.instructor_discount_codes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view active discount codes"
  ON public.instructor_discount_codes FOR SELECT
  TO anon
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

CREATE INDEX idx_instructor_discount_codes_instructor
  ON public.instructor_discount_codes(instructor_id);
