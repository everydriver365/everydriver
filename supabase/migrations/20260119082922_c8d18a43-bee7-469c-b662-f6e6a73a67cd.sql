-- Create recurring_expenses table for instructor fixed business costs
CREATE TABLE public.recurring_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  category TEXT NOT NULL DEFAULT 'other',
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Instructors can view their own recurring expenses
CREATE POLICY "Instructors can view their own recurring expenses"
ON public.recurring_expenses
FOR SELECT
USING (
  instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  )
);

-- Instructors can insert their own recurring expenses
CREATE POLICY "Instructors can insert their own recurring expenses"
ON public.recurring_expenses
FOR INSERT
WITH CHECK (
  instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  )
);

-- Instructors can update their own recurring expenses
CREATE POLICY "Instructors can update their own recurring expenses"
ON public.recurring_expenses
FOR UPDATE
USING (
  instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  )
);

-- Instructors can delete their own recurring expenses
CREATE POLICY "Instructors can delete their own recurring expenses"
ON public.recurring_expenses
FOR DELETE
USING (
  instructor_id IN (
    SELECT id FROM public.instructors WHERE auth_user_id = auth.uid()
  )
);

-- Create trigger for updating timestamps
CREATE TRIGGER update_recurring_expenses_updated_at
BEFORE UPDATE ON public.recurring_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();