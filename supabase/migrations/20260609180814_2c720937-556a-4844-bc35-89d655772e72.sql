-- C2 — Pupils can read their own conversations and messages, and send messages
DROP POLICY IF EXISTS "Pupils view own conversations" ON public.conversations;
CREATE POLICY "Pupils view own conversations"
ON public.conversations FOR SELECT TO authenticated
USING (
  pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid())
);

DROP POLICY IF EXISTS "Pupils view own messages" ON public.messages;
CREATE POLICY "Pupils view own messages"
ON public.messages FOR SELECT TO authenticated
USING (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE pupil_id IN (
      SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Pupils insert own messages" ON public.messages;
CREATE POLICY "Pupils insert own messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_type = 'pupil'
  AND conversation_id IN (
    SELECT id FROM public.conversations WHERE pupil_id IN (
      SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()
    )
  )
);

-- Allow pupils to mark instructor-sent messages as read/delivered in their own conversations
DROP POLICY IF EXISTS "Pupils update read receipts in own conversations" ON public.messages;
CREATE POLICY "Pupils update read receipts in own conversations"
ON public.messages FOR UPDATE TO authenticated
USING (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE pupil_id IN (
      SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()
    )
  )
)
WITH CHECK (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE pupil_id IN (
      SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()
    )
  )
);