-- Create admin conversations table for instructor-admin messaging
CREATE TABLE public.admin_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_message_preview TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin messages table
CREATE TABLE public.admin_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.admin_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('instructor', 'admin')),
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_conversations
CREATE POLICY "Instructors can view their own admin conversations"
  ON public.admin_conversations FOR SELECT
  USING (instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Instructors can create admin conversations"
  ON public.admin_conversations FOR INSERT
  WITH CHECK (instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all admin conversations"
  ON public.admin_conversations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update admin conversations"
  ON public.admin_conversations FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for admin_messages
CREATE POLICY "Instructors can view their conversation messages"
  ON public.admin_messages FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM public.admin_conversations WHERE instructor_id IN (
      SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "Instructors can send messages"
  ON public.admin_messages FOR INSERT
  WITH CHECK (
    sender_type = 'instructor' AND
    conversation_id IN (
      SELECT id FROM public.admin_conversations WHERE instructor_id IN (
        SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Instructors can update their own messages"
  ON public.admin_messages FOR UPDATE
  USING (
    sender_type = 'instructor' AND
    conversation_id IN (
      SELECT id FROM public.admin_conversations WHERE instructor_id IN (
        SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can view all admin messages"
  ON public.admin_messages FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can send messages"
  ON public.admin_messages FOR INSERT
  WITH CHECK (
    sender_type = 'admin' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update messages"
  ON public.admin_messages FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger function to update conversation last message
CREATE OR REPLACE FUNCTION public.update_admin_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.admin_conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER update_admin_conversation_timestamp
  AFTER INSERT ON public.admin_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_admin_conversation_last_message();

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_messages;

-- Create indexes
CREATE INDEX idx_admin_conversations_instructor ON public.admin_conversations(instructor_id);
CREATE INDEX idx_admin_messages_conversation ON public.admin_messages(conversation_id);
CREATE INDEX idx_admin_messages_created ON public.admin_messages(created_at DESC);