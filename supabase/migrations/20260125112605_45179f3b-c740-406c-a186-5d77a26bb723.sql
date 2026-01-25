-- Create admin_todos table for the admin dashboard to-do list
CREATE TABLE public.admin_todos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_todos ENABLE ROW LEVEL SECURITY;

-- Create policies - admins can manage all todos
CREATE POLICY "Authenticated users can view todos"
ON public.admin_todos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert todos"
ON public.admin_todos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update todos"
ON public.admin_todos FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete todos"
ON public.admin_todos FOR DELETE
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_todos_updated_at
BEFORE UPDATE ON public.admin_todos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for todos
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_todos;