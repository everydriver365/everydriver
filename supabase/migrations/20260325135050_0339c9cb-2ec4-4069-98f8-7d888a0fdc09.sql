-- Allow anonymous visitors to update conversation timestamps
CREATE POLICY "Anon can update whatsapp conversations"
ON public.whatsapp_conversations
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);