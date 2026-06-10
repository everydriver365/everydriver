
-- Fix 1: instructors
DROP POLICY IF EXISTS "Active instructors viewable by authenticated" ON public.instructors;

-- Fix 2: lesson_ratings
DROP POLICY IF EXISTS "Pupils can read own ratings" ON public.lesson_ratings;
DROP POLICY IF EXISTS "Pupils can insert own ratings" ON public.lesson_ratings;

CREATE POLICY "Pupils read own ratings (scoped)"
ON public.lesson_ratings FOR SELECT TO authenticated
USING (pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()));

CREATE POLICY "Pupils insert own ratings (scoped)"
ON public.lesson_ratings FOR INSERT TO authenticated
WITH CHECK (pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()));

-- Fix 3: live_chat_messages
DROP POLICY IF EXISTS "Anon can read chat messages" ON public.live_chat_messages;

-- Fix 4: live_chat_sessions
DROP POLICY IF EXISTS "Anon can read chat sessions" ON public.live_chat_sessions;

-- Fix 6: theory_streaks
DROP POLICY IF EXISTS "Pupils can read own streaks" ON public.theory_streaks;
DROP POLICY IF EXISTS "Pupils can insert own streaks" ON public.theory_streaks;
DROP POLICY IF EXISTS "Pupils can update own streaks" ON public.theory_streaks;

CREATE POLICY "Pupils manage own theory streaks"
ON public.theory_streaks FOR ALL TO authenticated
USING (pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()))
WITH CHECK (pupil_id IN (SELECT id FROM public.pupils WHERE auth_user_id = auth.uid()));
