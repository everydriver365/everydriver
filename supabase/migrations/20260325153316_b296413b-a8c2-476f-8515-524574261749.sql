DROP POLICY IF EXISTS "Instructors can view own whatsapp conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Instructors can update own whatsapp conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Instructors can view own whatsapp messages" ON public.whatsapp_messages;

CREATE POLICY "Authenticated can view whatsapp conversations"
ON public.whatsapp_conversations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can update whatsapp conversations"
ON public.whatsapp_conversations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can view whatsapp messages"
ON public.whatsapp_messages FOR SELECT TO authenticated USING (true);