
-- Create instructor_todos table (Todoist-style task management)
CREATE TABLE public.instructor_todos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 4, -- 1=urgent, 2=high, 3=medium, 4=none (like Todoist)
  due_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  project TEXT DEFAULT 'Inbox', -- project/category grouping
  display_order INTEGER NOT NULL DEFAULT 0,
  parent_id UUID REFERENCES public.instructor_todos(id) ON DELETE CASCADE, -- subtasks
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instructor_todos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Instructors can view their own todos"
  ON public.instructor_todos FOR SELECT
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can create their own todos"
  ON public.instructor_todos FOR INSERT
  WITH CHECK (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can update their own todos"
  ON public.instructor_todos FOR UPDATE
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

CREATE POLICY "Instructors can delete their own todos"
  ON public.instructor_todos FOR DELETE
  USING (instructor_id IN (SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()));

-- Auto-update timestamp
CREATE TRIGGER update_instructor_todos_updated_at
  BEFORE UPDATE ON public.instructor_todos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index
CREATE INDEX idx_instructor_todos_instructor_id ON public.instructor_todos(instructor_id);
CREATE INDEX idx_instructor_todos_parent_id ON public.instructor_todos(parent_id);
