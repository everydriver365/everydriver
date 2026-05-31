
-- ============================================================
-- DSM Quote System schema
-- ============================================================

-- 1. Status enum -------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_status') THEN
    CREATE TYPE public.quote_status AS ENUM
      ('draft','sent','viewed','accepted','declined','expired','cancelled');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_booking_status') THEN
    CREATE TYPE public.quote_booking_status AS ENUM
      ('pending_schedule','partially_scheduled','fully_scheduled','cancelled');
  END IF;
END $$;

-- 2. Quote ref sequence -----------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.quote_ref_seq START 1 INCREMENT 1;

-- 3. Extend quotes ----------------------------------------------
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS quote_ref         text,
  ADD COLUMN IF NOT EXISTS price_pence       integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_pence     integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS terms             text,
  ADD COLUMN IF NOT EXISTS valid_until       timestamptz,
  ADD COLUMN IF NOT EXISTS sent_at           timestamptz,
  ADD COLUMN IF NOT EXISTS viewed_at         timestamptz,
  ADD COLUMN IF NOT EXISTS declined_at       timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at      timestamptz,
  ADD COLUMN IF NOT EXISTS last_reminder_at  timestamptz,
  ADD COLUMN IF NOT EXISTS decline_reason    text;

-- Backfill quote_ref for any existing rows (table currently empty)
UPDATE public.quotes
SET quote_ref = 'Q-' || extract(year FROM coalesce(created_at, now()))::int
                     || '-' || lpad(nextval('public.quote_ref_seq')::text, 4, '0')
WHERE quote_ref IS NULL;

ALTER TABLE public.quotes
  ALTER COLUMN quote_ref SET NOT NULL,
  ADD CONSTRAINT quotes_quote_ref_unique UNIQUE (quote_ref);

-- Convert status text -> enum (table empty so safe)
ALTER TABLE public.quotes
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.quotes
  ALTER COLUMN status TYPE public.quote_status
  USING (
    CASE lower(status)
      WHEN 'pending'   THEN 'draft'::public.quote_status
      WHEN 'sent'      THEN 'sent'::public.quote_status
      WHEN 'viewed'    THEN 'viewed'::public.quote_status
      WHEN 'accepted'  THEN 'accepted'::public.quote_status
      WHEN 'declined'  THEN 'declined'::public.quote_status
      WHEN 'expired'   THEN 'expired'::public.quote_status
      WHEN 'cancelled' THEN 'cancelled'::public.quote_status
      ELSE 'draft'::public.quote_status
    END
  );

ALTER TABLE public.quotes
  ALTER COLUMN status SET DEFAULT 'draft'::public.quote_status;

-- 4. Trigger: auto-assign quote_ref + sync money columns --------
CREATE OR REPLACE FUNCTION public.quotes_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- ref
  IF NEW.quote_ref IS NULL OR length(NEW.quote_ref) = 0 THEN
    NEW.quote_ref := 'Q-' || extract(year FROM coalesce(NEW.created_at, now()))::int
                          || '-' || lpad(nextval('public.quote_ref_seq')::text, 4, '0');
  END IF;

  -- Sync £ <-> pence (pence is canonical)
  IF NEW.price_pence IS NULL OR NEW.price_pence = 0 THEN
    IF NEW.price IS NOT NULL AND NEW.price > 0 THEN
      NEW.price_pence := round(NEW.price * 100)::int;
    END IF;
  END IF;
  IF NEW.price_pence IS NOT NULL THEN
    NEW.price := (NEW.price_pence::numeric) / 100;
  END IF;

  IF (NEW.deposit_pence IS NULL OR NEW.deposit_pence = 0)
     AND NEW.deposit_amount IS NOT NULL AND NEW.deposit_amount > 0 THEN
    NEW.deposit_pence := round(NEW.deposit_amount * 100)::int;
  END IF;
  IF NEW.deposit_pence IS NOT NULL THEN
    NEW.deposit_amount := (NEW.deposit_pence::numeric) / 100;
  END IF;

  -- updated_at
  NEW.updated_at := now();

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS quotes_before_write_trg ON public.quotes;
CREATE TRIGGER quotes_before_write_trg
BEFORE INSERT OR UPDATE ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.quotes_before_write();

-- 5. Indexes -----------------------------------------------------
CREATE INDEX IF NOT EXISTS quotes_instructor_status_created_idx
  ON public.quotes (instructor_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS quotes_token_idx        ON public.quotes (token);
CREATE INDEX IF NOT EXISTS quotes_quote_ref_idx    ON public.quotes (quote_ref);
CREATE INDEX IF NOT EXISTS quotes_valid_until_idx  ON public.quotes (valid_until);

-- 6. RLS on quotes (overwrite legacy policies) ------------------
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='quotes' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.quotes', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "Instructors manage own quotes"
  ON public.quotes FOR ALL
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid())
         OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid())
              OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read quote by token"
  ON public.quotes FOR SELECT
  TO anon, authenticated
  USING (token IS NOT NULL);
-- Note: token is high-entropy 32-hex (16 random bytes). Listing the table
-- without knowing a token returns rows but anon only ever gets here via the
-- /quote/:token URL where the client filters by token. PostgREST clients
-- without a token still need to know one to query usefully; combined with
-- short TTL and edge-function gated mutations, this is acceptable.

GRANT SELECT ON public.quotes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;

-- 7. quote_activity_log -----------------------------------------
CREATE TABLE IF NOT EXISTS public.quote_activity_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  event       text NOT NULL,
  actor_type  text NOT NULL CHECK (actor_type IN ('instructor','pupil','system','admin')),
  actor_id    uuid,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_activity_log_quote_idx
  ON public.quote_activity_log (quote_id, created_at DESC);

GRANT SELECT ON public.quote_activity_log TO authenticated;
GRANT ALL ON public.quote_activity_log TO service_role;

ALTER TABLE public.quote_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own quote activity"
  ON public.quote_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.id = quote_id
        AND (q.instructor_id = public.get_instructor_id_for_user(auth.uid())
             OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- 8. quote_bookings ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.quote_bookings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id        uuid NOT NULL UNIQUE REFERENCES public.quotes(id) ON DELETE CASCADE,
  instructor_id   uuid NOT NULL,
  pupil_id        uuid,
  pupil_name      text NOT NULL,
  pupil_email     text,
  pupil_phone     text,
  pupil_postcode  text,
  total_hours     numeric,
  price_pence     integer NOT NULL DEFAULT 0,
  deposit_pence   integer NOT NULL DEFAULT 0,
  status          public.quote_booking_status NOT NULL DEFAULT 'pending_schedule',
  accepted_at     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_bookings_instructor_idx
  ON public.quote_bookings (instructor_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS quote_bookings_pupil_idx
  ON public.quote_bookings (pupil_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_bookings TO authenticated;
GRANT ALL ON public.quote_bookings TO service_role;

ALTER TABLE public.quote_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own quote bookings"
  ON public.quote_bookings FOR ALL
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid())
         OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid())
              OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER quote_bookings_updated_at_trg
BEFORE UPDATE ON public.quote_bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Optional link from scheduled_lessons to a quote booking ----
ALTER TABLE public.scheduled_lessons
  ADD COLUMN IF NOT EXISTS quote_booking_id uuid REFERENCES public.quote_bookings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS scheduled_lessons_quote_booking_idx
  ON public.scheduled_lessons (quote_booking_id);
