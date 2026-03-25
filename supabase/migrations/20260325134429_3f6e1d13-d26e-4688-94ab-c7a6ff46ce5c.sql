-- Allow anonymous visitors to create whatsapp conversations via the chat widget
CREATE POLICY "Anon can insert whatsapp conversations"
ON public.whatsapp_conversations
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous visitors to read conversations (for chat widget)
CREATE POLICY "Anon can select whatsapp conversations"
ON public.whatsapp_conversations
FOR SELECT
TO anon
USING (true);

-- Allow anonymous visitors to insert messages
CREATE POLICY "Anon can insert whatsapp messages"
ON public.whatsapp_messages
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous visitors to read messages (for chat widget)
CREATE POLICY "Anon can select whatsapp messages"
ON public.whatsapp_messages
FOR SELECT
TO anon
USING (true);