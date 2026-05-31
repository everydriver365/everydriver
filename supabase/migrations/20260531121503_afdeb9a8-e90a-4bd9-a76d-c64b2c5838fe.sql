
-- Auto-log status changes
CREATE OR REPLACE FUNCTION public.quotes_log_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.quote_activity_log (quote_id, event, actor_type, actor_id, metadata)
    VALUES (NEW.id, 'created', 'instructor', NEW.instructor_id, jsonb_build_object('status', NEW.status));
    RETURN NEW;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.quote_activity_log (quote_id, event, actor_type, actor_id, metadata)
    VALUES (
      NEW.id,
      NEW.status::text,
      CASE WHEN NEW.status IN ('viewed','accepted','declined') THEN 'pupil'
           WHEN NEW.status = 'expired' THEN 'system'
           ELSE 'instructor' END,
      NULL,
      jsonb_build_object('from', OLD.status, 'to', NEW.status)
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS quotes_log_status_change_trg ON public.quotes;
CREATE TRIGGER quotes_log_status_change_trg
AFTER INSERT OR UPDATE OF status ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.quotes_log_status_change();

-- Expire stale quotes (cron job)
CREATE OR REPLACE FUNCTION public.expire_stale_quotes()
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
SECURITY DEFINER
AS $$
DECLARE n integer;
BEGIN
  WITH upd AS (
    UPDATE public.quotes
    SET status = 'expired'
    WHERE status IN ('draft','sent','viewed')
      AND valid_until IS NOT NULL
      AND valid_until < now()
    RETURNING 1
  )
  SELECT count(*) INTO n FROM upd;
  RETURN n;
END $$;

GRANT EXECUTE ON FUNCTION public.expire_stale_quotes() TO service_role, authenticated;

-- Atomic accept via token (used by anon edge function)
CREATE OR REPLACE FUNCTION public.accept_quote_by_token(
  p_token text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.quote_bookings
LANGUAGE plpgsql
SET search_path = public
SECURITY DEFINER
AS $$
DECLARE
  q public.quotes;
  b public.quote_bookings;
  matched_pupil uuid;
BEGIN
  SELECT * INTO q FROM public.quotes WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'quote_not_found';
  END IF;
  IF q.status NOT IN ('draft','sent','viewed') THEN
    RAISE EXCEPTION 'quote_not_acceptable: %', q.status;
  END IF;
  IF q.valid_until IS NOT NULL AND q.valid_until < now() THEN
    UPDATE public.quotes SET status='expired' WHERE id = q.id;
    RAISE EXCEPTION 'quote_expired';
  END IF;

  IF q.email IS NOT NULL THEN
    SELECT id INTO matched_pupil
    FROM public.pupils
    WHERE instructor_id = q.instructor_id
      AND lower(email) = lower(q.email)
    LIMIT 1;
  END IF;

  UPDATE public.quotes
  SET status = 'accepted', accepted_at = now()
  WHERE id = q.id;

  INSERT INTO public.quote_bookings (
    quote_id, instructor_id, pupil_id, pupil_name, pupil_email,
    pupil_phone, pupil_postcode, total_hours, price_pence, deposit_pence
  ) VALUES (
    q.id, q.instructor_id, matched_pupil, q.pupil_name, q.email,
    q.phone, q.postcode, q.total_hours, q.price_pence, q.deposit_pence
  ) RETURNING * INTO b;

  INSERT INTO public.quote_activity_log (quote_id, event, actor_type, metadata)
  VALUES (q.id, 'booking_created', 'system',
          jsonb_build_object('quote_booking_id', b.id, 'pupil_matched', matched_pupil IS NOT NULL) || p_metadata);

  RETURN b;
END $$;

REVOKE EXECUTE ON FUNCTION public.accept_quote_by_token(text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_quote_by_token(text, jsonb) TO service_role;

-- Atomic decline via token (used by anon edge function)
CREATE OR REPLACE FUNCTION public.decline_quote_by_token(
  p_token text,
  p_reason text DEFAULT NULL
)
RETURNS public.quotes
LANGUAGE plpgsql
SET search_path = public
SECURITY DEFINER
AS $$
DECLARE q public.quotes;
BEGIN
  SELECT * INTO q FROM public.quotes WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'quote_not_found';
  END IF;
  IF q.status NOT IN ('draft','sent','viewed') THEN
    RAISE EXCEPTION 'quote_not_declinable: %', q.status;
  END IF;

  UPDATE public.quotes
  SET status = 'declined', declined_at = now(), decline_reason = p_reason
  WHERE id = q.id
  RETURNING * INTO q;

  RETURN q;
END $$;

REVOKE EXECUTE ON FUNCTION public.decline_quote_by_token(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.decline_quote_by_token(text, text) TO service_role;

-- Mark-viewed helper (anon-safe via service role from edge fn)
CREATE OR REPLACE FUNCTION public.mark_quote_viewed_by_token(p_token text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.quotes
  SET viewed_at = COALESCE(viewed_at, now()),
      status    = CASE WHEN status = 'sent' THEN 'viewed'::public.quote_status ELSE status END
  WHERE token = p_token;
END $$;

REVOKE EXECUTE ON FUNCTION public.mark_quote_viewed_by_token(text) FROM public;
GRANT EXECUTE ON FUNCTION public.mark_quote_viewed_by_token(text) TO service_role;
