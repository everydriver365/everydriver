-- Conversations table (one per instructor-pupil pair)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  last_message_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(instructor_id, pupil_id)
);

-- Messages table with read receipts
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('instructor', 'pupil')),
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_conversations_instructor_id ON public.conversations(instructor_id);
CREATE INDEX idx_conversations_pupil_id ON public.conversations(pupil_id);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Instructors can view their conversations"
  ON public.conversations FOR SELECT
  USING (instructor_id IN (SELECT id FROM public.instructors));

CREATE POLICY "Instructors can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructors));

CREATE POLICY "Pupils can view their conversations"
  ON public.conversations FOR SELECT
  USING (pupil_id IN (SELECT id FROM public.pupils));

-- RLS policies for messages
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE instructor_id IN (SELECT id FROM public.instructors)
         OR pupil_id IN (SELECT id FROM public.pupils)
    )
  );

CREATE POLICY "Instructors can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_type = 'instructor' AND
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE instructor_id IN (SELECT id FROM public.instructors)
    )
  );

CREATE POLICY "Pupils can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_type = 'pupil' AND
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE pupil_id IN (SELECT id FROM public.pupils)
    )
  );

CREATE POLICY "Users can update read status"
  ON public.messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE instructor_id IN (SELECT id FROM public.instructors)
         OR pupil_id IN (SELECT id FROM public.pupils)
    )
  );

-- Function to update conversation last_message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-update conversation on new message
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;