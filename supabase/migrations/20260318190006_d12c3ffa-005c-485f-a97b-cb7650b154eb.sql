
-- 1. Digital Forms & Checklists
CREATE TABLE public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  checklist_type TEXT NOT NULL DEFAULT 'pre_lesson',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.checklist_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.checklist_templates(id) ON DELETE CASCADE NOT NULL,
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  pupil_id UUID REFERENCES public.pupils(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES public.scheduled_lessons(id) ON DELETE SET NULL,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  photo_urls TEXT[] DEFAULT '{}',
  signature_url TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Document Vault
CREATE TABLE public.document_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes BIGINT,
  category TEXT NOT NULL DEFAULT 'general',
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.document_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.document_vault(id) ON DELETE CASCADE NOT NULL,
  reader_instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(document_id, reader_instructor_id)
);

-- 3. GPS Clock-In/Out
CREATE TABLE public.clock_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  clock_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out_at TIMESTAMPTZ,
  clock_in_latitude NUMERIC,
  clock_in_longitude NUMERIC,
  clock_out_latitude NUMERIC,
  clock_out_longitude NUMERIC,
  total_hours NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Team Messaging Channels
CREATE TABLE public.team_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  channel_type TEXT NOT NULL DEFAULT 'general',
  created_by UUID REFERENCES public.instructors(id) ON DELETE SET NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.team_channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.team_channels(id) ON DELETE CASCADE NOT NULL,
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, instructor_id)
);

CREATE TABLE public.team_channel_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.team_channels(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Wellbeing/Mood Tracker
CREATE TABLE public.mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  mood_score INTEGER NOT NULL,
  energy_level INTEGER,
  stress_level INTEGER,
  notes TEXT,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, logged_date)
);

-- 10. Availability Windows
CREATE TABLE public.availability_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_windows ENABLE ROW LEVEL SECURITY;

-- Checklist templates: owner access
CREATE POLICY "Instructors manage own checklist templates" ON public.checklist_templates FOR ALL TO authenticated USING (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid()))) WITH CHECK (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

-- Checklist submissions: owner access
CREATE POLICY "Instructors manage own checklist submissions" ON public.checklist_submissions FOR ALL TO authenticated USING (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid()))) WITH CHECK (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

-- Document vault: owner access
CREATE POLICY "Instructors manage own documents" ON public.document_vault FOR ALL TO authenticated USING (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid()))) WITH CHECK (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

-- Document read receipts: readers can insert own
CREATE POLICY "Instructors manage own read receipts" ON public.document_read_receipts FOR ALL TO authenticated USING (reader_instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid()))) WITH CHECK (reader_instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

-- Clock entries: owner access
CREATE POLICY "Instructors manage own clock entries" ON public.clock_entries FOR ALL TO authenticated USING (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid()))) WITH CHECK (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

-- Team channels: all authenticated can read
CREATE POLICY "Authenticated users can read channels" ON public.team_channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creators can manage channels" ON public.team_channels FOR INSERT TO authenticated WITH CHECK (created_by = (SELECT public.get_instructor_id_for_user(auth.uid())));

-- Team channel members: members can read, join own
CREATE POLICY "Members can read channel members" ON public.team_channel_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Instructors join channels" ON public.team_channel_members FOR INSERT TO authenticated WITH CHECK (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));
CREATE POLICY "Instructors leave channels" ON public.team_channel_members FOR DELETE TO authenticated USING (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

-- Team channel messages: members can read, send own
CREATE POLICY "Members can read messages" ON public.team_channel_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Instructors send messages" ON public.team_channel_messages FOR INSERT TO authenticated WITH CHECK (sender_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

-- Mood entries: owner access
CREATE POLICY "Instructors manage own mood entries" ON public.mood_entries FOR ALL TO authenticated USING (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid()))) WITH CHECK (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

-- Availability windows: owner access
CREATE POLICY "Instructors manage own availability windows" ON public.availability_windows FOR ALL TO authenticated USING (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid()))) WITH CHECK (instructor_id = (SELECT public.get_instructor_id_for_user(auth.uid())));

-- Realtime for team messaging
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_channel_messages;
