
-- Pupil Goals table
CREATE TABLE public.pupil_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL DEFAULT 'custom',
  title TEXT NOT NULL,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pupil_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pupil goals" ON public.pupil_goals FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pupil goals" ON public.pupil_goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update pupil goals" ON public.pupil_goals FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete pupil goals" ON public.pupil_goals FOR DELETE USING (true);

-- Lesson Streaks table
CREATE TABLE public.lesson_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_lesson_week TEXT,
  total_lessons_tracked INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read lesson streaks" ON public.lesson_streaks FOR SELECT USING (true);
CREATE POLICY "Anyone can insert lesson streaks" ON public.lesson_streaks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update lesson streaks" ON public.lesson_streaks FOR UPDATE USING (true);

-- Parent Push Subscriptions table
CREATE TABLE public.parent_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_phone TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_phone, endpoint)
);

ALTER TABLE public.parent_push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage parent push subs" ON public.parent_push_subscriptions FOR ALL USING (true);

-- Parent Conversations table for real messaging
CREATE TABLE public.parent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_phone TEXT NOT NULL,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  pupil_id UUID NOT NULL REFERENCES public.pupils(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_phone, instructor_id, pupil_id)
);

ALTER TABLE public.parent_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage parent conversations" ON public.parent_conversations FOR ALL USING (true);

-- Parent Messages table
CREATE TABLE public.parent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.parent_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL DEFAULT 'parent',
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.parent_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage parent messages" ON public.parent_messages FOR ALL USING (true);

-- Enable realtime for parent messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_conversations;

-- Trigger to update parent conversation last message
CREATE OR REPLACE FUNCTION public.update_parent_conversation_last_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.parent_conversations
  SET last_message_at = NEW.created_at,
      last_message_preview = LEFT(NEW.content, 100)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_parent_message_insert
AFTER INSERT ON public.parent_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_parent_conversation_last_message();
