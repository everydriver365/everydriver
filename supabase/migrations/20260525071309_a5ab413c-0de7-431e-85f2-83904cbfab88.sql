-- ========== Round 3: link manual blocks to Google events ==========
ALTER TABLE public.instructor_manual_blocks
  ADD COLUMN IF NOT EXISTS google_event_id text;

CREATE INDEX IF NOT EXISTS idx_manual_blocks_google_event
  ON public.instructor_manual_blocks (google_event_id)
  WHERE google_event_id IS NOT NULL;

-- Trigger: fire pg_net to google-calendar-service on INSERT / UPDATE / DELETE
CREATE OR REPLACE FUNCTION public.trigger_manual_block_calendar_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_op text;
  v_block_id uuid;
  v_instructor uuid;
  v_payload jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_op := 'delete';
    v_block_id := OLD.id;
    v_instructor := OLD.instructor_id;
    v_payload := jsonb_build_object(
      'action', 'syncManualBlock',
      'op', 'delete',
      'instructorId', OLD.instructor_id,
      'blockId', OLD.id,
      'googleEventId', OLD.google_event_id
    );
  ELSE
    v_op := CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END;
    v_block_id := NEW.id;
    v_instructor := NEW.instructor_id;
    v_payload := jsonb_build_object(
      'action', 'syncManualBlock',
      'op', v_op,
      'instructorId', NEW.instructor_id,
      'blockId', NEW.id,
      'block', jsonb_build_object(
        'id', NEW.id,
        'title', NEW.title,
        'block_type', NEW.block_type,
        'notes', NEW.notes,
        'start_datetime', NEW.start_datetime,
        'end_datetime', NEW.end_datetime,
        'google_event_id', NEW.google_event_id
      )
    );
  END IF;

  PERFORM net.http_post(
    url := 'https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/google-calendar-service',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cWVpYm92ZGh5b2hrZmFndWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTcyNjQsImV4cCI6MjA4Mjc5MzI2NH0.K2yV-2P603x7xVBhBpUrbjVzwz3L0nD3pMhz8qkeT0o'
    ),
    body := v_payload
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_manual_block_calendar_sync ON public.instructor_manual_blocks;
CREATE TRIGGER trg_manual_block_calendar_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.instructor_manual_blocks
  FOR EACH ROW EXECUTE FUNCTION public.trigger_manual_block_calendar_sync();

-- ========== Round 4: Google webhook channel state ==========
ALTER TABLE public.instructor_google_service_calendar
  ADD COLUMN IF NOT EXISTS webhook_channel_id text,
  ADD COLUMN IF NOT EXISTS webhook_resource_id text,
  ADD COLUMN IF NOT EXISTS webhook_channel_token text,
  ADD COLUMN IF NOT EXISTS webhook_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS webhook_last_error text;

CREATE INDEX IF NOT EXISTS idx_gcal_webhook_channel
  ON public.instructor_google_service_calendar (webhook_channel_id)
  WHERE webhook_channel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gcal_webhook_expires
  ON public.instructor_google_service_calendar (webhook_expires_at)
  WHERE webhook_expires_at IS NOT NULL;