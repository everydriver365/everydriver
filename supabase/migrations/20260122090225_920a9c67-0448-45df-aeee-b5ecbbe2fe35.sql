-- First drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Instructors can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Instructors can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Pupils can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Pupils can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;

DROP POLICY IF EXISTS "Instructors can view messages" ON public.messages;
DROP POLICY IF EXISTS "Instructors can send messages" ON public.messages;
DROP POLICY IF EXISTS "Pupils can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update read status" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can send messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can update messages" ON public.messages;

-- Now create simplified, working policies

-- CONVERSATIONS: Allow authenticated users full access
CREATE POLICY "Allow all operations on conversations"
ON public.conversations FOR ALL
USING (true)
WITH CHECK (true);

-- MESSAGES: Allow authenticated users full access
CREATE POLICY "Allow all operations on messages"
ON public.messages FOR ALL
USING (true)
WITH CHECK (true);