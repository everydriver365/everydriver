-- Create expenses table for instructor expense tracking
CREATE TABLE public.instructor_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  receipt_url TEXT,
  xero_synced BOOLEAN DEFAULT false,
  xero_sync_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instructor_expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies - instructors can manage their own expenses
CREATE POLICY "Instructors can view their own expenses"
  ON public.instructor_expenses FOR SELECT
  USING (true);

CREATE POLICY "Instructors can create their own expenses"
  ON public.instructor_expenses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Instructors can update their own expenses"
  ON public.instructor_expenses FOR UPDATE
  USING (true);

CREATE POLICY "Instructors can delete their own expenses"
  ON public.instructor_expenses FOR DELETE
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_instructor_expenses_updated_at
  BEFORE UPDATE ON public.instructor_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', true);

-- Storage policies for receipts
CREATE POLICY "Anyone can view receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'expense-receipts');

CREATE POLICY "Anyone can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'expense-receipts');

CREATE POLICY "Anyone can update receipts"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'expense-receipts');

CREATE POLICY "Anyone can delete receipts"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'expense-receipts');