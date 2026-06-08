
-- Phase 1+2: Outbound calendar feed token + Inbound ICS subscriptions

-- 1. Outbound feed token on instructors
ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS calendar_feed_token text;

-- Backfill secure random tokens for all existing instructors
UPDATE public.instructors
SET calendar_feed_token = encode(gen_random_bytes(32), 'hex')
WHERE calendar_feed_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS instructors_calendar_feed_token_uniq
  ON public.instructors (calendar_feed_token)
  WHERE calendar_feed_token IS NOT NULL;

-- 2. Inbound ICS subscriptions (one row per external calendar feed)
CREATE TABLE IF NOT EXISTS public.instructor_ics_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  url text NOT NULL,
  label text,
  is_active boolean NOT NULL DEFAULT true,
  last_polled_at timestamptz,
  last_status text,
  last_error text,
  last_event_count integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.instructor_ics_subscriptions TO authenticated;
GRANT ALL ON public.instructor_ics_subscriptions TO service_role;

ALTER TABLE public.instructor_ics_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructor manages own ICS subscriptions"
  ON public.instructor_ics_subscriptions
  FOR ALL
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()))
  WITH CHECK (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE INDEX IF NOT EXISTS ics_subs_instructor_idx
  ON public.instructor_ics_subscriptions (instructor_id);

CREATE INDEX IF NOT EXISTS ics_subs_active_idx
  ON public.instructor_ics_subscriptions (is_active, last_polled_at);

-- 3. Inbound ICS events (busy blocks pulled from those feeds)
CREATE TABLE IF NOT EXISTS public.instructor_ics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.instructor_ics_subscriptions(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  uid text NOT NULL,
  recurrence_id text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  title text,
  is_all_day boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.instructor_ics_events TO authenticated;
GRANT ALL ON public.instructor_ics_events TO service_role;

ALTER TABLE public.instructor_ics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructor reads own ICS events"
  ON public.instructor_ics_events
  FOR SELECT
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE UNIQUE INDEX IF NOT EXISTS ics_events_unique_idx
  ON public.instructor_ics_events (subscription_id, uid, coalesce(recurrence_id, ''));

CREATE INDEX IF NOT EXISTS ics_events_instructor_window_idx
  ON public.instructor_ics_events (instructor_id, start_at, end_at);

-- updated_at trigger for subscriptions
CREATE OR REPLACE FUNCTION public.touch_ics_subscriptions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ics_subs_touch_updated_at ON public.instructor_ics_subscriptions;
CREATE TRIGGER ics_subs_touch_updated_at
  BEFORE UPDATE ON public.instructor_ics_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_ics_subscriptions_updated_at();
