
DROP POLICY IF EXISTS "Admins can send messages" ON public.admin_messages;
DROP POLICY IF EXISTS "Instructors can send messages" ON public.admin_messages;
DROP POLICY IF EXISTS "Instructors can create admin conversations" ON public.admin_conversations;

CREATE POLICY "Admins insert messages"
ON public.admin_messages FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') AND sender_type = 'admin'
);

CREATE POLICY "Instructors insert own messages"
ON public.admin_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_type = 'instructor'
  AND sender_id = auth.uid()
  AND conversation_id IN (
    SELECT id FROM public.admin_conversations
    WHERE instructor_id IN (
      SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Instructors create own admin conversations"
ON public.admin_conversations FOR INSERT TO authenticated
WITH CHECK (
  instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  )
);
