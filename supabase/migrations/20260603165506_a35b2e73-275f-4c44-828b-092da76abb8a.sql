
-- ============================================================
-- External Booking Surface: allow-list + read RPCs
-- ============================================================

CREATE TABLE public.external_booking_allowlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  partner_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (instructor_id, partner_key)
);

CREATE INDEX idx_ext_booking_allowlist_partner_active
  ON public.external_booking_allowlist (partner_key, is_active)
  WHERE is_active = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.external_booking_allowlist TO authenticated;
GRANT ALL ON public.external_booking_allowlist TO service_role;

ALTER TABLE public.external_booking_allowlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage external booking allowlist"
  ON public.external_booking_allowlist
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_external_booking_allowlist_updated
  BEFORE UPDATE ON public.external_booking_allowlist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- RPC: list instructors a given partner is allowed to expose
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_external_bookable_instructors(
  p_partner_key TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  profile_image_url TEXT,
  hero_image_url TEXT,
  brand_colour TEXT,
  bio TEXT,
  car_type TEXT,
  car_make TEXT,
  car_model TEXT,
  hourly_rate NUMERIC,
  home_postcode TEXT,
  instructor_grade TEXT,
  available_from DATE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id,
    i.name,
    i.profile_image_url,
    i.hero_image_url,
    i.brand_colour,
    i.bio,
    i.car_type,
    i.car_make,
    i.car_model,
    i.hourly_rate,
    -- expose outward postcode only (privacy)
    split_part(i.home_postcode, ' ', 1) AS home_postcode,
    i.instructor_grade,
    i.available_from
  FROM public.external_booking_allowlist a
  JOIN public.instructors i ON i.id = a.instructor_id
  WHERE a.partner_key = p_partner_key
    AND a.is_active = true
    AND COALESCE(i.is_active, true) = true
    AND COALESCE(i.is_network_placeholder, false) = false;
$$;

GRANT EXECUTE ON FUNCTION public.list_external_bookable_instructors(TEXT) TO anon, authenticated;

-- ------------------------------------------------------------
-- RPC: opaque busy blocks for a given instructor + partner
-- Source-of-truth: Google Calendar (instructor_calendar_events) + manual blocks
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_external_instructor_busy_blocks(
  p_partner_key TEXT,
  p_instructor_id UUID,
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ
)
RETURNS TABLE (
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- gate: instructor must be on this partner's active allow-list
  WITH allowed AS (
    SELECT 1
    FROM public.external_booking_allowlist
    WHERE partner_key = p_partner_key
      AND instructor_id = p_instructor_id
      AND is_active = true
    LIMIT 1
  )
  SELECT ce.start_time, ce.end_time
  FROM public.instructor_calendar_events ce, allowed
  WHERE ce.instructor_id = p_instructor_id
    AND COALESCE(ce.is_busy, true) = true
    AND ce.end_time > p_from
    AND ce.start_time < p_to
  UNION ALL
  SELECT mb.start_datetime, mb.end_datetime
  FROM public.instructor_manual_blocks mb, allowed
  WHERE mb.instructor_id = p_instructor_id
    AND mb.end_datetime > p_from
    AND mb.start_datetime < p_to;
$$;

GRANT EXECUTE ON FUNCTION public.get_external_instructor_busy_blocks(TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated;
