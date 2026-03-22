
CREATE TABLE public.franchise_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  current_situation text,
  preferred_tier text,
  message text,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.franchise_enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit franchise enquiry" ON public.franchise_enquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
