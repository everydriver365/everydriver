
-- WhatsApp conversations table
CREATE TABLE public.whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  visitor_name TEXT,
  ai_enabled BOOLEAN NOT NULL DEFAULT true,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WhatsApp messages table
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL DEFAULT 'inbound',
  content TEXT NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'visitor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_whatsapp_conversations_instructor ON public.whatsapp_conversations(instructor_id);
CREATE INDEX idx_whatsapp_conversations_phone ON public.whatsapp_conversations(phone_number);
CREATE INDEX idx_whatsapp_messages_conversation ON public.whatsapp_messages(conversation_id);

-- RLS
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: instructors can read/update their own
CREATE POLICY "Instructors can view own whatsapp conversations"
  ON public.whatsapp_conversations FOR SELECT
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can update own whatsapp conversations"
  ON public.whatsapp_conversations FOR UPDATE
  TO authenticated
  USING (instructor_id = public.get_instructor_id_for_user(auth.uid()));

-- Allow service role / edge functions to insert
CREATE POLICY "Service can insert whatsapp conversations"
  ON public.whatsapp_conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Messages: instructors can read messages in their conversations
CREATE POLICY "Instructors can view own whatsapp messages"
  ON public.whatsapp_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_conversations wc
      WHERE wc.id = conversation_id
        AND wc.instructor_id = public.get_instructor_id_for_user(auth.uid())
    )
  );

-- Instructors can send manual messages
CREATE POLICY "Instructors can insert whatsapp messages"
  ON public.whatsapp_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
