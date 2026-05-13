
-- 1. Attach existing trigger function to update conversation metadata on every new message
CREATE TRIGGER trg_admin_messages_update_conversation
AFTER INSERT ON public.admin_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_admin_conversation_last_message();

-- 2. Trigger that notifies admin team via edge function when an instructor sends a message
CREATE OR REPLACE FUNCTION public.notify_admin_of_instructor_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_instructor_name text;
  v_instructor_id uuid;
BEGIN
  IF NEW.sender_type <> 'instructor' THEN
    RETURN NEW;
  END IF;

  SELECT ac.instructor_id, i.name
    INTO v_instructor_id, v_instructor_name
  FROM public.admin_conversations ac
  LEFT JOIN public.instructors i ON i.id = ac.instructor_id
  WHERE ac.id = NEW.conversation_id;

  PERFORM net.http_post(
    url := 'https://qyqeibovdhyohkfagujv.supabase.co/functions/v1/notify-admin-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cWVpYm92ZGh5b2hrZmFndWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTcyNjQsImV4cCI6MjA4Mjc5MzI2NH0.K2yV-2P603x7xVBhBpUrbjVzwz3L0nD3pMhz8qkeT0o'
    ),
    body := jsonb_build_object(
      'message_id', NEW.id,
      'conversation_id', NEW.conversation_id,
      'instructor_id', v_instructor_id,
      'instructor_name', COALESCE(v_instructor_name, 'Unknown Instructor'),
      'content', NEW.content,
      'created_at', NEW.created_at
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admin_messages_notify_admin
AFTER INSERT ON public.admin_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_of_instructor_message();
