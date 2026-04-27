ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS muted_at timestamptz;

ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS muted_at timestamptz;

ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS support_chat_muted_at timestamptz;

ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_wa_messages_unread
  ON public.whatsapp_messages (conversation_id)
  WHERE read_at IS NULL AND direction = 'inbound';