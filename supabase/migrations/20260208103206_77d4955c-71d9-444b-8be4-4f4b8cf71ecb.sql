
-- Add soft delete and urgent flag to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;

-- Add index for filtering non-deleted messages efficiently
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON public.messages (conversation_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_messages_urgent ON public.messages (conversation_id, is_urgent) WHERE is_urgent = true;
