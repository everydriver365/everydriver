-- Make visitor_email nullable since it's no longer required
ALTER TABLE public.live_chat_sessions 
ALTER COLUMN visitor_email DROP NOT NULL;