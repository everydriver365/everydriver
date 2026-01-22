-- Add attachment columns to messages table
ALTER TABLE public.messages 
ADD COLUMN attachment_url TEXT,
ADD COLUMN attachment_type TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.messages.attachment_url IS 'URL to the attached file in storage';
COMMENT ON COLUMN public.messages.attachment_type IS 'Type of attachment: image, file';

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to chat-attachments
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

-- Allow anyone to view chat attachments (they're part of conversations)
CREATE POLICY "Chat attachments are viewable by authenticated users"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments');

-- Allow users to delete their own attachments
CREATE POLICY "Users can delete their own chat attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);