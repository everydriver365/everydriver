-- ============ Pupil RLS on conversations + messages ============
DROP POLICY IF EXISTS "pupils_read_own_conversations" ON public.conversations;
CREATE POLICY "pupils_read_own_conversations"
ON public.conversations FOR SELECT
USING (
  pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid())
);

DROP POLICY IF EXISTS "pupils_insert_own_conversations" ON public.conversations;
CREATE POLICY "pupils_insert_own_conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid())
);

DROP POLICY IF EXISTS "pupils_read_own_messages" ON public.messages;
CREATE POLICY "pupils_read_own_messages"
ON public.messages FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "pupils_insert_own_messages" ON public.messages;
CREATE POLICY "pupils_insert_own_messages"
ON public.messages FOR INSERT
WITH CHECK (
  sender_type = 'pupil'
  AND sender_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid())
  AND conversation_id IN (
    SELECT id FROM public.conversations
    WHERE pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "pupils_update_message_read_at" ON public.messages;
CREATE POLICY "pupils_update_message_read_at"
ON public.messages FOR UPDATE
USING (
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid())
  )
)
WITH CHECK (
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid())
  )
);

-- ============ Auto push on new message ============
CREATE OR REPLACE FUNCTION public.notify_on_message_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv RECORD;
  v_instructor_name text;
  v_pupil_name text;
  v_preview text;
  v_url text := 'https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/';
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cWVpYm92ZGh5b2hrZmFndWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTcyNjQsImV4cCI6MjA4Mjc5MzI2NH0.K2yV-2P603x7xVBhBpUrbjVzwz3L0nD3pMhz8qkeT0o';
BEGIN
  SELECT c.instructor_id, c.pupil_id, i.name AS instructor_name, p.name AS pupil_name
    INTO v_conv
  FROM public.conversations c
  JOIN public.instructors i ON i.id = c.instructor_id
  JOIN public.pupils p ON p.id = c.pupil_id
  WHERE c.id = NEW.conversation_id;

  IF NOT FOUND THEN RETURN NEW; END IF;

  v_preview := left(coalesce(NEW.content, ''), 80);

  IF NEW.sender_type = 'instructor' THEN
    PERFORM net.http_post(
      url := v_url || 'notify-pupil',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || v_key),
      body := jsonb_build_object(
        'pupilId', v_conv.pupil_id,
        'type', 'message',
        'title', v_conv.instructor_name || ' sent you a message',
        'body', v_preview,
        'data', jsonb_build_object('section','messages','conversationId', NEW.conversation_id)
      )
    );
  ELSIF NEW.sender_type = 'pupil' THEN
    PERFORM net.http_post(
      url := v_url || 'notify-instructor',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || v_key),
      body := jsonb_build_object(
        'instructorId', v_conv.instructor_id,
        'type', 'pupil_message',
        'pupilName', v_conv.pupil_name,
        'pupilId', v_conv.pupil_id,
        'messagePreview', v_preview
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_message_insert ON public.messages;
CREATE TRIGGER trg_notify_on_message_insert
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_message_insert();