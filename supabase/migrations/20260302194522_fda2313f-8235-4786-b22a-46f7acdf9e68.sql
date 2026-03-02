
-- Create friendship status enum
CREATE TYPE public.friendship_status AS ENUM ('pending', 'accepted', 'declined');

-- Create instructor_friends table
CREATE TABLE public.instructor_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  status friendship_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, recipient_id),
  CHECK (requester_id != recipient_id)
);

-- Create instructor_direct_messages table
CREATE TABLE public.instructor_direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instructor_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS for instructor_friends: instructors can see their own friend records
CREATE POLICY "Instructors can view own friend records"
  ON public.instructor_friends FOR SELECT TO authenticated
  USING (
    requester_id = public.get_instructor_id_for_user(auth.uid())
    OR recipient_id = public.get_instructor_id_for_user(auth.uid())
  );

CREATE POLICY "Instructors can send friend requests"
  ON public.instructor_friends FOR INSERT TO authenticated
  WITH CHECK (requester_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can update own friend records"
  ON public.instructor_friends FOR UPDATE TO authenticated
  USING (
    requester_id = public.get_instructor_id_for_user(auth.uid())
    OR recipient_id = public.get_instructor_id_for_user(auth.uid())
  );

CREATE POLICY "Instructors can delete own friend records"
  ON public.instructor_friends FOR DELETE TO authenticated
  USING (
    requester_id = public.get_instructor_id_for_user(auth.uid())
    OR recipient_id = public.get_instructor_id_for_user(auth.uid())
  );

-- RLS for instructor_direct_messages
CREATE POLICY "Instructors can view own messages"
  ON public.instructor_direct_messages FOR SELECT TO authenticated
  USING (
    sender_id = public.get_instructor_id_for_user(auth.uid())
    OR recipient_id = public.get_instructor_id_for_user(auth.uid())
  );

CREATE POLICY "Instructors can send messages"
  ON public.instructor_direct_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = public.get_instructor_id_for_user(auth.uid()));

CREATE POLICY "Instructors can update own messages"
  ON public.instructor_direct_messages FOR UPDATE TO authenticated
  USING (sender_id = public.get_instructor_id_for_user(auth.uid()));

-- Enable realtime for DMs
ALTER PUBLICATION supabase_realtime ADD TABLE public.instructor_direct_messages;

-- Updated_at trigger for friends
CREATE TRIGGER set_updated_at_instructor_friends
  BEFORE UPDATE ON public.instructor_friends
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
