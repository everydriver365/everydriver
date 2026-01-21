-- Create live chat sessions table
CREATE TABLE public.live_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_type TEXT NOT NULL CHECK (session_type IN ('admin', 'instructor')),
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE SET NULL,
  visitor_name TEXT NOT NULL,
  visitor_email TEXT NOT NULL,
  visitor_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'offline_message')),
  assigned_to UUID,
  source_page TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create live chat messages table
CREATE TABLE public.live_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.live_chat_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'admin', 'instructor')),
  sender_id UUID,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create live chat typing indicators table
CREATE TABLE public.live_chat_typing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.live_chat_sessions(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('visitor', 'admin', 'instructor')),
  user_id UUID,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_type, user_id)
);

-- Add online status fields
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX idx_live_chat_sessions_status ON public.live_chat_sessions(status);
CREATE INDEX idx_live_chat_sessions_instructor ON public.live_chat_sessions(instructor_id);
CREATE INDEX idx_live_chat_sessions_type ON public.live_chat_sessions(session_type);
CREATE INDEX idx_live_chat_messages_session ON public.live_chat_messages(session_id);
CREATE INDEX idx_live_chat_messages_created ON public.live_chat_messages(created_at);
CREATE INDEX idx_live_chat_typing_session ON public.live_chat_typing(session_id);

-- Enable RLS
ALTER TABLE public.live_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_typing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_chat_sessions
-- Anyone can create a session (visitors starting a chat)
CREATE POLICY "Anyone can create chat sessions"
ON public.live_chat_sessions
FOR INSERT
WITH CHECK (true);

-- Anyone can view sessions (needed for visitors to see their own chat)
CREATE POLICY "Anyone can view chat sessions"
ON public.live_chat_sessions
FOR SELECT
USING (true);

-- Admins and instructors can update sessions
CREATE POLICY "Admins and instructors can update sessions"
ON public.live_chat_sessions
FOR UPDATE
USING (true);

-- RLS Policies for live_chat_messages
-- Anyone can insert messages
CREATE POLICY "Anyone can send messages"
ON public.live_chat_messages
FOR INSERT
WITH CHECK (true);

-- Anyone can view messages
CREATE POLICY "Anyone can view messages"
ON public.live_chat_messages
FOR SELECT
USING (true);

-- Anyone can update messages (for read receipts)
CREATE POLICY "Anyone can update messages"
ON public.live_chat_messages
FOR UPDATE
USING (true);

-- RLS Policies for live_chat_typing
-- Anyone can manage typing indicators
CREATE POLICY "Anyone can manage typing indicators"
ON public.live_chat_typing
FOR ALL
USING (true);

-- Enable realtime for messages and typing
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_typing;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_sessions;

-- Create function to update session timestamp
CREATE OR REPLACE FUNCTION public.update_live_chat_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.live_chat_sessions 
  SET updated_at = now()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic session timestamp updates
CREATE TRIGGER update_session_on_message
AFTER INSERT ON public.live_chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_live_chat_session_timestamp();