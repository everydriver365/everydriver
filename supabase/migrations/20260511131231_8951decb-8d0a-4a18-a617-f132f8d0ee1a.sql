ALTER TABLE public.test_swap_offers REPLICA IDENTITY FULL;
ALTER TABLE public.test_requests REPLICA IDENTITY FULL;
ALTER TABLE public.test_slot_reservations REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='test_swap_offers') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.test_swap_offers';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='test_requests') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.test_requests';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='test_slot_reservations') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.test_slot_reservations';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.trg_notify_test_swap_offer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM 'pending' THEN RETURN NEW; END IF;
  PERFORM net.http_post(
    url := 'https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/notify-test-swap-match',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cWVpYm92ZGh5b2hrZmFndWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTcyNjQsImV4cCI6MjA4Mjc5MzI2NH0.K2yV-2P603x7xVBhBpUrbjVzwz3L0nD3pMhz8qkeT0o'
    ),
    body := jsonb_build_object('kind','offer_received','record', jsonb_build_object(
      'id', NEW.id,
      'test_request_id', NEW.test_request_id,
      'offered_test_centre_name', NEW.offered_test_centre_name,
      'offered_test_date', NEW.offered_test_date,
      'offered_test_time', NEW.offered_test_time,
      'status', NEW.status
    ))
  );
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.trg_notify_have_test_posted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.request_type IS DISTINCT FROM 'have_test' OR NEW.status IS DISTINCT FROM 'active' THEN RETURN NEW; END IF;
  PERFORM net.http_post(
    url := 'https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/notify-test-swap-match',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cWVpYm92ZGh5b2hrZmFndWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTcyNjQsImV4cCI6MjA4Mjc5MzI2NH0.K2yV-2P603x7xVBhBpUrbjVzwz3L0nD3pMhz8qkeT0o'
    ),
    body := jsonb_build_object('kind','have_test_posted','record', jsonb_build_object(
      'id', NEW.id,
      'instructor_id', NEW.instructor_id,
      'test_centre_id', NEW.test_centre_id,
      'test_centre_name', NEW.test_centre_name,
      'test_date', NEW.test_date,
      'test_time', NEW.test_time,
      'request_type', NEW.request_type,
      'status', NEW.status
    ))
  );
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS notify_test_swap_offer ON public.test_swap_offers;
CREATE TRIGGER notify_test_swap_offer AFTER INSERT ON public.test_swap_offers
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_test_swap_offer();

DROP TRIGGER IF EXISTS notify_have_test_posted ON public.test_requests;
CREATE TRIGGER notify_have_test_posted AFTER INSERT ON public.test_requests
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_have_test_posted();